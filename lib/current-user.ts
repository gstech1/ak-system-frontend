export type CurrentAuthUser = {
  id?: string;
  username?: string;
  role?: string;
  permissions?: string[];
  websiteManagement?: boolean;
  [key: string]: unknown;
};

/** Read the saved profile and fill stale fields from the signed access token. */
export function getCurrentAuthUser(): CurrentAuthUser | null {
  if (typeof window === "undefined") return null;

  let user: CurrentAuthUser | null = null;
  try {
    const rawUser = localStorage.getItem("authUser");
    const parsed = rawUser ? JSON.parse(rawUser) : null;
    if (parsed && typeof parsed === "object") user = parsed;
  } catch {
    user = null;
  }

  try {
    const token = localStorage.getItem("accessToken");
    const payload = token?.split(".")[1];
    if (payload) {
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const claims = JSON.parse(atob(base64)) as CurrentAuthUser;
      user = { ...user, ...claims };
    }
  } catch {
    // Keep the saved profile if an older token cannot be decoded.
  }

  return user;
}
