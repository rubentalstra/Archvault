export const socialProviderIds = ["github", "google", "microsoft"] as const;

export type SocialProviderId = (typeof socialProviderIds)[number];

