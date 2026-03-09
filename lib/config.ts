export type ConfigCheck = {
  required: Record<string, string | null>;
  optional: Record<string, string | null>;
  missingRequired: string[];
  warnings: string[];
};

export function getConfigCheck(): ConfigCheck {
  const required = {
    OPEN_PARLIAMENT_API: process.env.OPEN_PARLIAMENT_API ?? null
  };

  const optional = {
    LEGISINFO_BASE_URL: process.env.LEGISINFO_BASE_URL ?? null,
    DATABASE_URL: process.env.DATABASE_URL ?? null,
    BASIC_AUTH_USERS: process.env.BASIC_AUTH_USERS ?? null,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? null,
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? null,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? null,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    GITHUB_ID: process.env.GITHUB_ID ?? null,
    GITHUB_SECRET: process.env.GITHUB_SECRET ?? null,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? null,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? null
  };

  const missingRequired = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const warnings: string[] = [];
  if (!optional.BASIC_AUTH_USERS) {
    warnings.push('BASIC_AUTH_USERS is not set; demo credentials are active (demo@releaseparliament.ca / demo1234).');
  }
  if (!optional.DATABASE_URL) {
    warnings.push('DATABASE_URL is not set; local JSON file persistence is being used for votes.');
  }
  if (optional.OPENAI_API_KEY && !optional.OPENAI_MODEL) {
    warnings.push('OPENAI_API_KEY is set without OPENAI_MODEL; default model selection may be ambiguous.');
  }

  return { required, optional, missingRequired, warnings };
}
