import ServerConfig from "@/models/ServerConfig";

export type PublicServerConfig = {
  webName: string;
  sidebarLogoUrl: string;
  sidebarTitle: string;
  tg_channel: string;
  tg_username: string;
  isDirectLoginOpen: boolean;
  tg_bot: string;
};

export async function getPublicServerConfig(): Promise<PublicServerConfig> {
  const config = (await ServerConfig.findOne({ _id: 1 }).lean()) as
    | Partial<PublicServerConfig>
    | null;

  return {
    webName:
      config?.webName || process.env.NEXT_PUBLIC_APP_NAME || "CODEWITH-VIVEK",
    sidebarLogoUrl: config?.sidebarLogoUrl || "",
    sidebarTitle:
      config?.sidebarTitle ||
      process.env.NEXT_PUBLIC_APP_NAME ||
      "CODEWITH-VIVEK",
    tg_channel: config?.tg_channel || process.env.NEXT_PUBLIC_TG || "",
    tg_username: config?.tg_username || "",
    isDirectLoginOpen: config?.isDirectLoginOpen ?? true,
    tg_bot:
      config?.tg_bot || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "",
  };
}
