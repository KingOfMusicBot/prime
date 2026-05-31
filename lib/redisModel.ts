import crypto from "crypto";
import { getRedisClient } from "@/lib/redis";

type PlainObject = Record<string, any>;

type QueryMode = "one" | "many";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function pathGet(obj: any, path: string) {
  const parts = path.split(".");
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function pathSet(obj: any, path: string, value: any) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function regexTest(value: any, pattern: string, options?: string) {
  const text = value == null ? "" : String(value);
  return new RegExp(pattern, options || "").test(text);
}

function matchesCondition(value: any, cond: any): boolean {
  if (cond && typeof cond === "object" && !Array.isArray(cond)) {
    if ("$regex" in cond) return regexTest(value, cond.$regex, cond.$options);
    if ("$in" in cond) {
      if (Array.isArray(value)) return value.some((v) => cond.$in.includes(v));
      return cond.$in.includes(value);
    }
    if ("$ne" in cond) return value !== cond.$ne;
    return Object.entries(cond).every(([k, v]) => {
      const nested = value?.[k];
      return matchesCondition(nested, v);
    });
  }
  return value === cond;
}

function matches(doc: PlainObject, filter: PlainObject = {}): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  if (Array.isArray(filter.$or)) return filter.$or.some((f: any) => matches(doc, f));

  return Object.entries(filter).every(([key, cond]) => {
    if (key === "$or") return true;
    if (key === "$expr") {
      const expr: any = cond;
      if (expr?.$regexMatch?.input?.$ifNull && expr?.$regexMatch?.regex != null) {
        const [fieldRef, fallback] = expr.$regexMatch.input.$ifNull;
        const fieldName = typeof fieldRef === "string" ? fieldRef.replace(/^\$/, "") : "";
        const raw = pathGet(doc, fieldName);
        return regexTest(raw ?? fallback ?? "", String(expr.$regexMatch.regex), expr.$regexMatch.options || "");
      }
      return true;
    }

    if (key.includes(".")) {
      const [head, ...rest] = key.split(".");
      const headVal = (doc as any)[head];
      if (Array.isArray(headVal)) {
        const restPath = rest.join(".");
        return headVal.some((item) => matchesCondition(pathGet(item, restPath), cond));
      }
      return matchesCondition(pathGet(doc, key), cond);
    }

    return matchesCondition((doc as any)[key], cond);
  });
}

function applySelect(doc: any, select?: string): any {
  if (!select || !doc) return doc;
  const fields = select.split(/\s+/).filter(Boolean);
  if (fields.length === 0) return doc;
  const isExclude = fields.some((f) => f.startsWith("-"));

  if (isExclude) {
    const out = clone(doc);
    for (const f of fields) {
      if (!f.startsWith("-")) continue;
      const field = f.slice(1);
      const parts = field.split(".");
      if (parts.length === 1) {
        delete out[field];
      } else {
        const parent = pathGet(out, parts.slice(0, -1).join("."));
        if (parent && typeof parent === "object") delete parent[parts[parts.length - 1]];
      }
    }
    return out;
  }

  const out: any = { _id: doc._id };
  for (const field of fields) {
    const val = pathGet(doc, field);
    if (val !== undefined) pathSet(out, field, val);
  }
  return out;
}

class RedisDocument {
  private __model: any;
  constructor(model: any, data: any) {
    this.__model = model;
    Object.assign(this, data);
  }

  toObject() {
    const { __model, ...rest } = this as any;
    return clone(rest);
  }

  async save() {
    return this.__model._save(this.toObject());
  }
}

class Query {
  private model: any;
  private mode: QueryMode;
  private filter: any;
  private _select?: string;
  private _sort?: Record<string, 1 | -1>;
  private _skip = 0;
  private _limit: number | null = null;
  private _lean = false;

  constructor(model: any, mode: QueryMode, filter: any) {
    this.model = model;
    this.mode = mode;
    this.filter = filter || {};
  }

  select(sel: string) {
    this._select = sel;
    return this;
  }

  sort(sort: Record<string, 1 | -1>) {
    this._sort = sort;
    return this;
  }

  skip(n: number) {
    this._skip = n;
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  lean() {
    this._lean = true;
    return this;
  }

  async exec() {
    let docs = await this.model._findAll(this.filter);

    if (this._sort && Object.keys(this._sort).length) {
      const [[field, direction]] = Object.entries(this._sort);
      docs = docs.sort((a: any, b: any) => {
        const av = pathGet(a, field);
        const bv = pathGet(b, field);
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av > bv ? 1 : -1) * (direction === -1 ? -1 : 1);
      });
    }

    if (this._skip > 0) docs = docs.slice(this._skip);
    if (typeof this._limit === "number") docs = docs.slice(0, this._limit);

    docs = docs.map((d: any) => applySelect(d, this._select));

    if (this.mode === "one") {
      const one = docs[0] ?? null;
      if (!one) return null;
      return this._lean ? one : new RedisDocument(this.model, one);
    }

    return this._lean ? docs : docs.map((d: any) => new RedisDocument(this.model, d));
  }

  then(resolve: any, reject: any) {
    return this.exec().then(resolve, reject);
  }

  catch(reject: any) {
    return this.exec().catch(reject);
  }

  finally(cb: any) {
    return this.exec().finally(cb);
  }
}

function applyUpdate(doc: any, update: any, options: any = {}) {
  if (update?.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      if (k.includes("$[elem]")) {
        const arrayPath = k.split(".$[elem]")[0];
        const fieldPath = k.split(".$[elem].")[1];
        const arr = pathGet(doc, arrayPath);
        if (Array.isArray(arr)) {
          const filter = options?.arrayFilters?.[0] || {};
          const [afKey, afValue] = Object.entries(filter)[0] || [];
          const afPath = afKey ? String(afKey).replace(/^elem\./, "") : "";
          arr.forEach((item: any) => {
            if (!afKey || pathGet(item, afPath) === afValue) {
              pathSet(item, fieldPath, v);
            }
          });
        }
      } else {
        pathSet(doc, k, v);
      }
    }
  } else {
    Object.assign(doc, update || {});
  }
}

export function createRedisModel(collectionName: string) {
  const prefix = `redisdb:${collectionName}`;
  const idsKey = `${prefix}:ids`;

  const model: any = {
    async _allDocs() {
      const redis = await getRedisClient();
      const ids = await redis.sMembers(idsKey);
      if (!ids.length) return [];
      const values = await Promise.all(ids.map((id) => redis.get(`${prefix}:${id}`)));
      return values.filter(Boolean).map((v) => JSON.parse(v as string));
    },

    async _findAll(filter: any) {
      const docs = await model._allDocs();
      return docs.filter((d: any) => matches(d, filter));
    },

    async _save(data: any) {
      const redis = await getRedisClient();
      const now = new Date().toISOString();
      const id = data._id ? String(data._id) : crypto.randomUUID();
      const existingRaw = await redis.get(`${prefix}:${id}`);
      const existing = existingRaw ? JSON.parse(existingRaw) : null;

      const doc = {
        ...(existing || {}),
        ...clone(data),
        _id: id,
        createdAt: existing?.createdAt || data.createdAt || now,
        updatedAt: now,
      };

      await redis.set(`${prefix}:${id}`, JSON.stringify(doc));
      await redis.sAdd(idsKey, id);
      return new RedisDocument(model, doc);
    },

    find(filter: any = {}, _projection?: any) {
      return new Query(model, "many", filter);
    },

    findOne(filter: any = {}, _projection?: any) {
      return new Query(model, "one", filter);
    },

    findById(id: string) {
      return new Query(model, "one", { _id: String(id) });
    },

    async create(data: any) {
      return model._save(data);
    },

    async countDocuments(filter: any = {}) {
      const docs = await model._findAll(filter);
      return docs.length;
    },

    async updateOne(filter: any, update: any, options: any = {}) {
      const docs = await model._findAll(filter);
      const first = docs[0];
      if (!first) return { matchedCount: 0, modifiedCount: 0 };
      applyUpdate(first, update, options);
      await model._save(first);
      return { matchedCount: 1, modifiedCount: 1 };
    },

    async updateMany(filter: any, update: any, options: any = {}) {
      const docs = await model._findAll(filter);
      let modifiedCount = 0;
      for (const d of docs) {
        applyUpdate(d, update, options);
        await model._save(d);
        modifiedCount++;
      }
      return { matchedCount: docs.length, modifiedCount };
    },

    async findByIdAndUpdate(id: string, update: any, options: any = {}) {
      const doc = (await model.findById(id).lean().exec()) as any;
      if (!doc) return null;
      applyUpdate(doc, update, options);
      const saved = await model._save(doc);
      return options?.new ? saved : new RedisDocument(model, doc);
    },

    async findOneAndUpdate(filter: any, update: any, options: any = {}) {
      const found = (await model.findOne(filter).lean().exec()) as any;
      if (!found) {
        if (options?.upsert) {
          const created = await model._save({ ...(filter || {}), ...(update?.$set || {}) });
          return options?.new ? created : null;
        }
        return null;
      }
      applyUpdate(found, update, options);
      const saved = await model._save(found);
      return options?.new ? saved : new RedisDocument(model, found);
    },
  };

  return model;
}
