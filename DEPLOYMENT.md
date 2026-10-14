# Frontend deployment

This Next.js application is deployed separately from `backend-api`.

## Required settings

Set `NEXT_PUBLIC_API_URL` to `https://api.suntreemyanmar.com` in Coolify before building the frontend. Do not include a route such as `/warranty`.

Expose this frontend at `https://dashboard.suntreemyanmar.com`. The `/management` path on the public website is already used for the existing website CMS login and must remain attached to that site.

## Coolify application settings

- Source repository: `gstech1/ak-system-frontend`
- Branch: `main`
- Build strategy: Nixpacks / Node.js
- Base directory: `/`
- Build command: `npm run build`
- Start command: `npm start`
- Exposed port: `3000`
- Public domain: `https://dashboard.suntreemyanmar.com`
- Build-time environment variable: `NEXT_PUBLIC_API_URL=https://api.suntreemyanmar.com`

Create the `dashboard` DNS record in Cloudflare pointing to the existing server before enabling this domain in Coolify. The frontend production build now stops if the API URL is missing or points to localhost.

Use Node.js 20.9 or newer.

## Build and run

```sh
npm ci
npm run build
npm start
```

The production server listens on the port provided by the hosting platform. The hosting platform must run this as a Node.js application; a static export is not configured.
