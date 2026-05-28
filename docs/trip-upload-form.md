# Private Traveler upload form

The public site stays static on GitHub Pages. The upload form lives in a separate Cloudflare Worker so authentication and GitHub write credentials never reach browser JavaScript.

## Product behavior

1. Visit the private Worker URL.
2. Sign in with GitHub.
3. The Worker allowlists only Ashish's GitHub login.
4. Fill the form:
   - title
   - date
   - location dropdown
   - 1-10 photos
5. Pick a cover photo in the preview grid.
6. Submit.
7. The Worker creates a GitHub PR with:
   - `src/content/places/<slug>.md`
   - `public/photos/<slug>/01-cover.*`
   - `public/photos/<slug>/02-*`
   - `public/photos/<slug>/captions.yaml`
8. Merge the PR. GitHub Pages deploys and the trip appears on `/traveler`.

## Why PR mode first

PR mode is safer than direct commits while the form is new. The site already has CI/build validation, so a bad upload fails before it reaches `master`.

After a few successful uploads, set `PUBLISH_MODE = "direct_master"` in `worker-trip-upload/wrangler.toml` if you want uploads to auto-appear after the workflow deploy.

## Setup checklist

### 1. GitHub OAuth app

Create a GitHub OAuth app with callback:

```txt
https://<your-worker-host>/oauth/callback
```

Set Worker secrets:

```sh
cd worker-trip-upload
wrangler secret put GITHUB_OAUTH_CLIENT_ID
wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
```

### 2. GitHub App for repo writes

Create a GitHub App installed on `Ask149/Ask149.github.io` with repository contents and pull request write permissions.

Set Worker secrets:

```sh
wrangler secret put GITHUB_APP_ID
wrangler secret put GITHUB_APP_PRIVATE_KEY
wrangler secret put GITHUB_APP_INSTALLATION_ID
```

### 3. Session secret

```sh
openssl rand -base64 32 | wrangler secret put SESSION_SECRET
```

### 4. Deploy

```sh
cd worker-trip-upload
npm install
npm run tsc
npm run deploy
```

## Location dropdown

Locations are defined in `worker-trip-upload/src/locations.ts`.

The list starts with common India, US, and international cities. Add a location there when you need another dropdown option. Each location includes:

- city/country label
- country code
- airport code
- latitude/longitude
- traveler map coordinates

## Timeline scalability

Uploaded entries include `visitDate`, `locationId`, and `uploadedAt`. The Traveler page sorts by `visitDate` when present, falls back to `yearMonth`, and the timeline includes a year jump selector so a growing list does not become one long undifferentiated scroll.

This stays static and fast for dozens to low hundreds of trips. If photos eventually make the Git repo too large, move image storage to R2 while keeping metadata in Git.
