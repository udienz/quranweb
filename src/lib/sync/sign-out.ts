import { emptyUserData } from "../userdata/schema";
import { userDataSync } from "../userdata/store";

let signingOut = false;

/** True while signOutOfAccount clears this browser: the sync hook then neither starts a sync nor saves a result. */
export function isSigningOut(): boolean {
  return signingOut;
}

/**
 * Sign out, and remove the account's reading data from this browser unless the reader chooses to keep it there. After a
 * sync the browser holds the account's whole document (bookmarks and notes from other devices too) and remembers the
 * account as its owner; on a shared computer, leaving both behind let the next person read them, and their own changes
 * went to the account when its owner signed in again. On the reader's own device keeping it is fine.
 *
 * Pending local changes are sent first. If that fails (no connection, for example) nothing is cleared and the reader
 * stays signed in: signing out needs the server anyway, and clearing first would lose those changes. The result says
 * whether the reader was signed out.
 */
export async function signOutOfAccount(
  deps: { sync: () => Promise<unknown>; signOut: () => Promise<unknown> },
  { keepOnDevice }: { keepOnDevice: boolean },
): Promise<boolean> {
  try {
    await deps.sync();
  } catch {
    return false;
  }
  if (keepOnDevice) {
    await deps.signOut();
    return true;
  }
  // Stays set after a successful sign-out: a sync that was already running must not save the account's data back.
  // Signing in again goes through the identity provider, a full page load that starts with a fresh module.
  signingOut = true;
  userDataSync.save(emptyUserData());
  userDataSync.clearOwner();
  try {
    await deps.signOut();
    return true;
  } catch (error) {
    // Still signed in: let the sync bring the account's data back.
    signingOut = false;
    throw error;
  }
}
