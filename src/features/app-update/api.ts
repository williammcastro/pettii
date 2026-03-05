import { supabase } from "@/lib/supabase";

export type AppUpdatePlatform = "ios" | "android";

export type AppVersionRule = {
  platform: AppUpdatePlatform;
  min_build: number;
  force_update: boolean;
  store_url: string;
  title: string;
  message: string;
  updated_at?: string;
};

export async function fetchActiveAppVersionRule(
  platform: AppUpdatePlatform
): Promise<AppVersionRule | null> {
  const { data, error } = await supabase
    .from("app_version_rules")
    .select("platform, min_build, force_update, store_url, title, message, updated_at")
    .eq("platform", platform)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as AppVersionRule | null) ?? null;
}
