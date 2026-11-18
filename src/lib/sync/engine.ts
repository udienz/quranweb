import { emptyUserData, mergeUserData, type UserData } from "../userdata/schema";

export interface SyncDeps {
  userId: string;
  /** The data in this browser. */
  load(): UserData;
  save(data: UserData): void;
  /** The account the data in this browser was last synchronised with (null: never signed in here). */
  getOwner(): string | null;
  setOwner(userId: string): void;
  /** Send this device's data to the server and get the merged result back. */
  exchange(data: UserData): Promise<UserData>;
}

/**
 * One round of synchronisation. The merge rule makes the order irrelevant, so changes made while
 * the request was running are simply merged in afterwards.
 *
 * Data in this browser that belongs to another account is never sent: a different reader signing in
 * on a shared computer starts from their own account's data, and the previous reader's data stays on
 * their account (and is dropped from this browser).
 * Data from before any sign-in (no owner) is merged in, so nothing the reader had is lost.
 */
export async function runSync(deps: SyncDeps): Promise<UserData> {
  const owner = deps.getOwner();
  if (owner !== null && owner !== deps.userId) {
    // Another reader's data: drop it from this browser before anything is sent.
    deps.save(emptyUserData());
  }
  deps.setOwner(deps.userId);
  const server = await deps.exchange(deps.load());
  const merged = mergeUserData(deps.load(), server);
  deps.save(merged);
  return merged;
}
