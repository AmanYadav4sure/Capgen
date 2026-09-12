export const UPLOAD_LIMITS_MB = {
  free: 100, // Free Tier: 100 MB
  pro: 200, // Pro / Standard: 200 MB
  team: 500, // Team / Premium: 500 MB
} as const;

export function getUserUploadLimit(userProfile: { plan?: string; isPro?: boolean } | null): { maxMB: number; maxBytes: number } {
  const plan = userProfile?.plan?.toLowerCase() || (userProfile?.isPro ? 'pro' : 'free');
  const maxMB = UPLOAD_LIMITS_MB[plan as keyof typeof UPLOAD_LIMITS_MB] || 100;
  return {
    maxMB,
    maxBytes: maxMB * 1024 * 1024,
  };
}
