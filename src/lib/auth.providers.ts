import type { SocialProviderId } from "./auth.social";

type OAuthProviderConfig = {
  clientId: string;
  clientSecret: string;
};

type MicrosoftProviderConfig = OAuthProviderConfig & {
  tenantId: string;
};

type SocialProvidersConfig = Partial<{
  github: OAuthProviderConfig;
  google: OAuthProviderConfig;
  microsoft: MicrosoftProviderConfig;
}>;

type ProviderEnvConfig = {
  provider: SocialProviderId;
  enabled: string | undefined;
  clientId: string | undefined;
  clientSecret: string | undefined;
  tenantId?: string | undefined;
};

function parseOptionalBoolean(value: string | undefined, envName: string): boolean | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid boolean value for ${envName}: "${value}". Use true/false, 1/0, yes/no, or on/off.`,
  );
}

function sanitizeSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveProviderEnabled(config: ProviderEnvConfig): {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
} {
  const clientId = sanitizeSecret(config.clientId);
  const clientSecret = sanitizeSecret(config.clientSecret);
  const enabledFlag = parseOptionalBoolean(
    config.enabled,
    `AUTH_SOCIAL_${config.provider.toUpperCase()}_ENABLED`,
  );

  const hasAnyCredential = Boolean(clientId || clientSecret);
  const hasAllCredentials = Boolean(clientId && clientSecret);

  if (hasAnyCredential && !hasAllCredentials) {
    throw new Error(
      `Incomplete ${config.provider} OAuth configuration: both clientId and clientSecret are required when either is set.`,
    );
  }

  if (enabledFlag === true && !hasAllCredentials) {
    throw new Error(
      `${config.provider} OAuth is enabled but missing credentials. Set both clientId and clientSecret, or disable AUTH_SOCIAL_${config.provider.toUpperCase()}_ENABLED.`,
    );
  }

  const enabled = enabledFlag ?? hasAllCredentials;

  return {
    enabled,
    clientId,
    clientSecret,
    tenantId: sanitizeSecret(config.tenantId),
  };
}

function resolveSocialProviders(): {
  socialProviders: SocialProvidersConfig;
  enabledProviderIds: SocialProviderId[];
} {
  const providerEnvConfig: ProviderEnvConfig[] = [
    {
      provider: "github",
      enabled: process.env.AUTH_SOCIAL_GITHUB_ENABLED,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    {
      provider: "google",
      enabled: process.env.AUTH_SOCIAL_GOOGLE_ENABLED,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    {
      provider: "microsoft",
      enabled: process.env.AUTH_SOCIAL_MICROSOFT_ENABLED,
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID,
    },
  ];

  const socialProviders: SocialProvidersConfig = {};
  const enabledProviderIds: SocialProviderId[] = [];

  for (const providerConfig of providerEnvConfig) {
    const resolved = resolveProviderEnabled(providerConfig);

    if (!resolved.enabled || !resolved.clientId || !resolved.clientSecret) {
      continue;
    }

    enabledProviderIds.push(providerConfig.provider);

    if (providerConfig.provider === "microsoft") {
      socialProviders.microsoft = {
        clientId: resolved.clientId,
        clientSecret: resolved.clientSecret,
        tenantId: resolved.tenantId ?? "common",
      };
      continue;
    }

    socialProviders[providerConfig.provider] = {
      clientId: resolved.clientId,
      clientSecret: resolved.clientSecret,
    };
  }

  return {
    socialProviders,
    enabledProviderIds,
  };
}

const resolvedSocialProviders = resolveSocialProviders();

export const enabledSocialProviderIds = resolvedSocialProviders.enabledProviderIds;
export const socialProvidersConfig = resolvedSocialProviders.socialProviders;

