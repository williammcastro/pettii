import AsyncStorage from "@react-native-async-storage/async-storage";

const CLINIC_LOGO_CACHE_PREFIX = "clinic_logo_url";

function buildClinicLogoCacheKey(userId: string) {
  return `${CLINIC_LOGO_CACHE_PREFIX}:${userId}`;
}

export async function getCachedClinicLogoUrl(userId: string): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(buildClinicLogoCacheKey(userId));
    return value || null;
  } catch {
    return null;
  }
}

export async function setCachedClinicLogoUrl(userId: string, logoUrl: string) {
  try {
    await AsyncStorage.setItem(buildClinicLogoCacheKey(userId), logoUrl);
  } catch {
    // noop: cache best-effort
  }
}

export async function clearCachedClinicLogoUrl(userId: string) {
  try {
    await AsyncStorage.removeItem(buildClinicLogoCacheKey(userId));
  } catch {
    // noop: cache best-effort
  }
}
