"use client";

import { createAuthClient } from "better-auth/react";
import { PROVIDER_ID } from "./config";

export const authClient = createAuthClient();

export function signIn(callbackURL: string) {
  return authClient.signIn.social({ provider: PROVIDER_ID, callbackURL });
}
