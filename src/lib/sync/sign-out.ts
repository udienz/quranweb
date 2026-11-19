import { emptyUserData } from "../userdata/schema";
import { userDataSync } from "../userdata/store";

let signingOut = false;

/** True while signOutClearingData runs: the sync hook then neither starts a sync nor saves a result. */
export function isSigningOut(): boolean {
  return signingOut;
}

/**
 * Sign out and remove the account's reading data from this browser. After a sync the browser holds the account's
 * whole document (bookmarks and notes from other devices too) and remembers the account as its owner; leaving both
 * behind let the next person at a shared computer read them, and their own changes went to the account when its owner
 * signed in again.
 *
 * Pending local changes are sent first. If that fails (no connection, for example) nothing is cleared and the reader
 * stays signed in: signing out needs the server anyway, and clearing first would lose those changes. The result says
 * whether the reader was signed out.
 */
export async function signOutClearingData(deps: { sync: () => Promise<unknown>; signOut: () => Promise<unknown> }): Promise<boolean> {
  try {
    await deps.sync();
  } catch {
    return false;
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
