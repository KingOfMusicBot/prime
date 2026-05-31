import { getRedisClient } from "@/lib/redis";

async function dbConnect() {
  return getRedisClient();
}

export default dbConnect;
