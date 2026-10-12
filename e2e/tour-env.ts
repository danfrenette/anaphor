/** Identity and storage settings for the isolated Playwright tour server. */
export const tourTestEnv = {
  TOUR_AGENT_TOKEN: "playwright-agent-token",
  TOUR_SESSION_SECRET: "playwright-session-secret",
  TOUR_IDENTITY_ADAPTER: "test",
  TOUR_OWNER_LOGIN: "danfrenette",
  TOUR_PUBLIC_ORIGIN: "http://127.0.0.1:3105",
  GITHUB_CLIENT_ID: "",
  GITHUB_CLIENT_SECRET: "",
  VERCEL_ENV: "",
  VERCEL_URL: "",
  VERCEL_PROJECT_PRODUCTION_URL: "",
  NEXT_TELEMETRY_DISABLED: "1",
} as const;
