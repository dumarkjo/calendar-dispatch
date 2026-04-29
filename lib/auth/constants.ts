export const ACCOUNT_VERIFIER_EMAIL = "teidd.amtec.uplb@up.edu.ph";

export function isVerifierEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase() === ACCOUNT_VERIFIER_EMAIL;
}
