/**
 * Simple file-based storage for single user
 * Stores bookmarks, watch history, and settings in a JSON file
 */

import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "user-data.json");

export interface Bookmark {
  id: string;
  title: string;
  thumbnail?: string;
  url?: string;
  added_at: string;
}

export interface WatchHistoryItem {
  id: string;
  title: string;
  thumbnail?: string;
  url?: string;
  watched_at: string;
  progress?: number; // Seconds watched
}

export interface UserData {
  password_hash: string;
  bookmarks: Bookmark[];
  watch_history: WatchHistoryItem[];
  settings: Record<string, unknown>;
}

const DEFAULT_DATA: UserData = {
  password_hash: "",
  bookmarks: [],
  watch_history: [],
  settings: {},
};

/**
 * Read user data from file
 */
export async function readUserData(): Promise<UserData> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    // File doesn't exist or is invalid, return defaults
    return { ...DEFAULT_DATA };
  }
}

/**
 * Write user data to file
 */
export async function writeUserData(data: UserData): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Write atomically (write to temp file, then rename)
    const tempFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempFile, DATA_FILE);
  } catch (error) {
    console.error("Failed to write user data:", error);
    throw error;
  }
}

/**
 * Check if data file exists
 */
export async function dataFileExists(): Promise<boolean> {
  try {
    await fs.access(DATA_FILE);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Bookmarks
// ============================================================

/**
 * Get all bookmarks
 */
export async function getBookmarks(): Promise<Bookmark[]> {
  const data = await readUserData();
  return data.bookmarks;
}

/**
 * Add a bookmark
 */
export async function addBookmark(bookmark: Omit<Bookmark, "added_at">): Promise<void> {
  const data = await readUserData();

  // Check if already bookmarked
  const exists = data.bookmarks.find((b) => b.id === bookmark.id);
  if (exists) {
    return; // Already bookmarked
  }

  // Add to beginning of array
  data.bookmarks.unshift({
    ...bookmark,
    added_at: new Date().toISOString(),
  });

  await writeUserData(data);
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(videoId: string): Promise<void> {
  const data = await readUserData();
  data.bookmarks = data.bookmarks.filter((b) => b.id !== videoId);
  await writeUserData(data);
}

/**
 * Check if a video is bookmarked
 */
export async function isBookmarked(videoId: string): Promise<boolean> {
  const data = await readUserData();
  return data.bookmarks.some((b) => b.id === videoId);
}

// ============================================================
// Watch History
// ============================================================

/**
 * Get watch history
 */
export async function getWatchHistory(): Promise<WatchHistoryItem[]> {
  const data = await readUserData();
  return data.watch_history;
}

/**
 * Add to watch history
 */
export async function addToWatchHistory(
  item: Omit<WatchHistoryItem, "watched_at">,
): Promise<void> {
  const data = await readUserData();

  // Remove if already exists (we'll re-add at top)
  data.watch_history = data.watch_history.filter((h) => h.id !== item.id);

  // Add to beginning
  data.watch_history.unshift({
    ...item,
    watched_at: new Date().toISOString(),
  });

  // Keep only last 100 items
  data.watch_history = data.watch_history.slice(0, 100);

  await writeUserData(data);
}

/**
 * Clear watch history
 */
export async function clearWatchHistory(): Promise<void> {
  const data = await readUserData();
  data.watch_history = [];
  await writeUserData(data);
}

/**
 * Update playback progress
 */
export async function updateProgress(
  videoId: string,
  progress: number,
): Promise<void> {
  const data = await readUserData();
  const item = data.watch_history.find((h) => h.id === videoId);

  if (item) {
    item.progress = progress;
    item.watched_at = new Date().toISOString();
    await writeUserData(data);
  }
}

// ============================================================
// Settings
// ============================================================

/**
 * Get settings
 */
export async function getSettings(): Promise<Record<string, unknown>> {
  const data = await readUserData();
  return data.settings;
}

/**
 * Update settings
 */
export async function updateSettings(
  settings: Record<string, unknown>,
): Promise<void> {
  const data = await readUserData();
  data.settings = { ...data.settings, ...settings };
  await writeUserData(data);
}
