import { cookies } from "next/headers";

import { getSettings } from "@/lib/file-storage";
import { getUsernameFromToken } from "@/lib/simple-auth";

import {
  DEFAULT_SOURCES,
  parseSourcesFromText,
  setSourcesCache,
} from "./sources";
import type { CaijiSource } from "./types";

const SOURCES_KEY = "caiji_sources";

/**
 * Load sources from user settings and update cache
 * Call this at the start of API routes that need sources
 */
export async function loadSourcesFromSettings(): Promise<CaijiSource[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mc-auth-token")?.value;

    if (!token) {
      setSourcesCache(DEFAULT_SOURCES);
      return DEFAULT_SOURCES;
    }

    const username = await getUsernameFromToken(token);
    if (!username) {
      setSourcesCache(DEFAULT_SOURCES);
      return DEFAULT_SOURCES;
    }

    const settings = await getSettings(username);
    const sourcesText = settings[SOURCES_KEY] as string;

    if (!sourcesText) {
      setSourcesCache(DEFAULT_SOURCES);
      return DEFAULT_SOURCES;
    }

    const sources = parseSourcesFromText(sourcesText);
    setSourcesCache(sources);
    return sources;
  } catch (error) {
    console.error("Failed to load sources:", error);
    setSourcesCache(DEFAULT_SOURCES);
    return DEFAULT_SOURCES;
  }
}
