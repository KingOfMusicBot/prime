import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient, type RedisClientType } from "redis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: RedisClientType | undefined;
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (!global.__redisClient) {
    global.__redisClient = createClient({ url: REDIS_URL });
    global.__redisClient.on("error", (err) => {
      console.error("Redis client error:", err);
    });
  }

  if (!global.__redisClient.isOpen) {
    await global.__redisClient.connect();
  }

  return global.__redisClient;
}
