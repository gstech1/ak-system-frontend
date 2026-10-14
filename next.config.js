/** @type {import('next').NextConfig} */
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (process.env.NODE_ENV === "production" && !configuredApiUrl) {
  throw new Error(
    "Set NEXT_PUBLIC_API_URL to the deployed SWMS API before building for production.",
  );
}

const apiUrl = new URL(configuredApiUrl || "http://localhost:5001");

if (
  process.env.NODE_ENV === "production" &&
  ["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname)
) {
  throw new Error(
    "NEXT_PUBLIC_API_URL must point to the deployed SWMS API, not localhost.",
  );
}

const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

module.exports = nextConfig;
