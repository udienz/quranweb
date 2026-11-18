// Who to contact about personal data, from the environment (never from git: this repository is public).
export interface PrivacyContact {
  name: string | null;
  email: string | null;
}

export function privacyContact(env: Record<string, string | undefined> = process.env): PrivacyContact {
  const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : null);
  const email = clean(env.PRIVACY_CONTACT_EMAIL);
  return { name: clean(env.PRIVACY_CONTACT_NAME), email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null };
}
