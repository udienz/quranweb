import type { Locale } from "../config";
import { en } from "./en";
import { id } from "./id";
import { ar } from "./ar";
import { bn } from "./bn";
import { fa } from "./fa";
import { fr } from "./fr";
import { ms } from "./ms";
import { ru } from "./ru";
import { tr } from "./tr";
import { bs } from "./bs";
import { es } from "./es";
import { ml } from "./ml";
import { ta } from "./ta";
import { th } from "./th";
import { uz } from "./uz";
import { zh } from "./zh";
import { ur } from "./ur";
import type { Messages } from "./types";

export type { Messages, PluralKey, StringKey } from "./types";

export const MESSAGES: Record<Locale, Messages> = { en, id, tr, ms, bn, fr, ru, ur, ar, fa, es, bs, zh, th, uz, ta, ml };
