// The admins are the signed-in readers whose (verified) email is in ADMIN_EMAILS, a comma-separated list in the
// server environment. It is never written in git: this repository is public.
export function adminEmails(env: Record<string, string | undefined> = process.env): Set<string> {
  return new Set(
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
}

export function isAdminEmail(email: string, emailVerified: boolean, admins = adminEmails()): boolean {
  return emailVerified && admins.has(email.trim().toLowerCase());
}
