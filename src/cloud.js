import { createClient } from "@supabase/supabase-js";
let client;
export let cloudStatus = { configured: false, user: null, error: null };
export async function initCloud() {
  try {
    const r = await fetch("/api/config");
    if (!r.ok) return;
    const config = await r.json();
    if (!config.url || !config.publishableKey) return;
    client = createClient(config.url, config.publishableKey);
    cloudStatus.configured = true;
    const { data } = await client.auth.getSession();
    cloudStatus.user = data.session?.user || null;
    client.auth.onAuthStateChange((event, session) => {
      cloudStatus.user = session?.user || null;
      window.dispatchEvent(
        new CustomEvent("labelproof-auth", { detail: event }),
      );
    });
  } catch (e) {
    cloudStatus.error = e.message;
  }
}
export const cloudClient = () => {
  if (!client)
    throw new Error(
      "Cloud project is not connected yet. Local review remains available.",
    );
  return client;
};
export async function authAction(action, email, password) {
  const c = cloudClient();
  let result;
  if (action === "signup")
    result = await c.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: location.origin + "/dashboard/account" },
    });
  if (action === "login")
    result = await c.auth.signInWithPassword({ email, password });
  if (action === "recovery")
    result = await c.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + "/dashboard/account",
    });
  if (action === "password") result = await c.auth.updateUser({ password });
  if (action === "logout") result = await c.auth.signOut();
  if (result?.error) throw result.error;
  return result;
}
