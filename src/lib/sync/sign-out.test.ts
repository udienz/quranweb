import { describe, expect, it } from "vitest";
import { emptyUserData, liveBookmarks, setBookmarkNote, toggleBookmark } from "../userdata/schema";
import { userDataSync } from "../userdata/store";
import { isSigningOut, signOutClearingData } from "./sign-out";

const T = "2026-11-19T10:00:00.000Z";

function signedInBrowser() {
  userDataSync.save(setBookmarkNote(toggleBookmark(emptyUserData(), 2, 255, T), 2, 255, "private note", T));
  userDataSync.setOwner("reader-a");
}

// The order matters: a successful sign-out leaves the module in its signed-out state (as after a real one).
describe("signing out", () => {
  it("keeps everything and stays signed in when pending changes cannot be sent", async () => {
    signedInBrowser();
    let signedOut = false;
    const done = await signOutClearingData({
      sync: async () => {
        throw new Error("offline");
      },
      signOut: async () => void (signedOut = true),
    });
    expect(done).toBe(false);
    expect(signedOut).toBe(false);
    expect(liveBookmarks(userDataSync.load())).toHaveLength(1);
    expect(userDataSync.getOwner()).toBe("reader-a");
    expect(isSigningOut()).toBe(false);
  });

  it("lets the sync refill the browser when the sign-out request itself fails", async () => {
    signedInBrowser();
    await expect(
      signOutClearingData({
        sync: async () => {},
        signOut: async () => {
          throw new Error("server error");
        },
      }),
    ).rejects.toThrow("server error");
    expect(isSigningOut()).toBe(false);
  });

  it("sends pending changes first, then removes the account's data and owner from this browser", async () => {
    signedInBrowser();
    const order: string[] = [];
    const done = await signOutClearingData({
      sync: async () => {
        order.push(`sync:${liveBookmarks(userDataSync.load()).length}`);
      },
      signOut: async () => void order.push(`signOut:${liveBookmarks(userDataSync.load()).length}`),
    });
    expect(done).toBe(true);
    expect(order).toEqual(["sync:1", "signOut:0"]);
    // The next person at this browser sees nothing of the previous reader's notes.
    expect(userDataSync.load()).toEqual(emptyUserData());
    expect(userDataSync.getOwner()).toBeNull();
    // A sync that was still running is told not to save the account's data back.
    expect(isSigningOut()).toBe(true);
  });
});
