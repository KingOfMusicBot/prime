import { createRedisModel } from "@/lib/redisModel";

const TokenManager = createRedisModel("token_manager");

export default TokenManager;
