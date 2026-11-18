import type { Locale } from "../config";
import { en } from "./en";
import { id } from "./id";
import { tr } from "./tr";
import type { Messages } from "./types";

export type { Messages, PluralKey, StringKey } from "./types";

export const MESSAGES: Record<Locale, Messages> = { en, id, tr };
