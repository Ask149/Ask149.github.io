export interface Env {
  ENVIRONMENT: string;
  GITHUB_OAUTH_CLIENT_ID: string;
  GITHUB_OAUTH_CLIENT_SECRET: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_APP_INSTALLATION_ID: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  ALLOWED_GITHUB_LOGINS: string;
  SESSION_SECRET: string;
  PUBLIC_SITE_URL: string;
  PUBLISH_MODE: "pr" | "direct_master";
}

export interface Session {
  login: string;
  id: number;
  name?: string;
  exp: number;
}

export interface LocationDef {
  id: string;
  group: "India" | "United States" | "Other";
  label: string;
  city: string;
  country: string;
  countryCode: string;
  airportCode?: string;
  slug: string;
  geo: [number, number];
  mapCoords: { leftPct: number; topPct: number };
}

export interface UploadPhoto {
  sourceName: string;
  destFile: string;
  mime: string;
  bytes: Uint8Array;
  caption: string;
}

export interface UploadPayload {
  slug: string;
  title: string;
  visitDate: string;
  yearMonth: string;
  reason: string;
  location: LocationDef;
  photos: UploadPhoto[];
  uploadedAt: string;
}

export interface PublishResult {
  mode: "pr" | "direct_master";
  slug: string;
  branch: string;
  commitUrl: string;
  prUrl?: string;
  liveUrl: string;
}
