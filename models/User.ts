import { createRedisModel } from "@/lib/redisModel";

const User = createRedisModel("users");

export default User;
