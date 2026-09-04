/**
 * Whether Google sign-in is actually usable. Real credentials from Google
 * Cloud Console have to be configured via env vars before the provider is
 * registered in src/auth.ts - this is the single flag both that file and
 * the login/register pages check, so a deployment without those env vars
 * never registers the provider *and* never shows a button for it, instead
 * of shipping a "Continue with Google" that fails the moment it's clicked.
 */
export const googleSignInEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);
