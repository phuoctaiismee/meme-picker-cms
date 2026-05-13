export const accessTiers = ["free", "pro", "premium"] as const;

export type AccessTier = (typeof accessTiers)[number];
