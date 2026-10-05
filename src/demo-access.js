// Deliberately public credentials for the server-restricted synthetic workspace.
export const DEMO_ACCESS = Object.freeze({
  email: "demo@labelproof.example",
  password: "LabelProofDemo!2026",
});
export const isDemoUser = (user) => user?.email === DEMO_ACCESS.email;
