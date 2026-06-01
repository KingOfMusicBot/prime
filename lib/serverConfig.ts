import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";

export async function getAllServerConfigs() {
  try {
    await dbConnect();
    const configs = await ServerConfig.find({}).lean();
    return configs;
  } catch (error) {
    console.warn("Unable to load server configs, using fallback:", error);
    return [];
  }
} 
