/**
 * Multi-user file-based storage
 * Each user has their own {username}.json file
 * Stores password, role, bookmarks, watch history, and settings
 */

import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

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

export type UserRole = "admin" | "user";

export interface UserData {
  password_hash: string;
  role?: UserRole; // undefined or "user" for regular users, "admin" for admins
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
 * Get user file path
 */
function getUserFilePath(username: string): string {
  return path.join(DATA_DIR, `${username}.json`);
}

/**
 * Read user data from file
 */
export async function readUserData(username: string): Promise<UserData> {
  try {
    const userFile = getUserFilePath(username);
    const content = await fs.readFile(userFile, "utf-8");
    return JSON.parse(content);
  } catch {
    // File doesn't exist or is invalid, return defaults
    return { ...DEFAULT_DATA };
  }
}

/**
 * Write user data to file
 */
export async function writeUserData(
  username: string,
  data: UserData,
): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    const userFile = getUserFilePath(username);
    // Write atomically (write to temp file, then rename)
    const tempFile = `${userFile}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempFile, userFile);
  } catch (error) {
    console.error("Failed to write user data:", error);
    throw error;
  }
}

/**
 * Check if user file exists
 */
export async function userExists(username: string): Promise<boolean> {
  try {
    const userFile = getUserFilePath(username);
    await fs.access(userFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if this is the first user (no user files exist)
 */
export async function isFirstUser(): Promise<boolean> {
  try {
    const files = await fs.readdir(DATA_DIR);
    const userFiles = files.filter((f) => f.endsWith(".json"));
    return userFiles.length === 0;
  } catch {
    return true; // If directory doesn't exist, it's the first user
  }
}

// ============================================================
// Bookmarks
// ============================================================

/**
 * Get all bookmarks
 */
export async function getBookmarks(username: string): Promise<Bookmark[]> {
  const data = await readUserData(username);
  return data.bookmarks;
}

/**
 * Add a bookmark
 */
export async function addBookmark(
  username: string,
  bookmark: Omit<Bookmark, "added_at">,
): Promise<void> {
  const data = await readUserData(username);

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

  await writeUserData(username, data);
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(
  username: string,
  videoId: string,
): Promise<void> {
  const data = await readUserData(username);
  data.bookmarks = data.bookmarks.filter((b) => b.id !== videoId);
  await writeUserData(username, data);
}

/**
 * Check if a video is bookmarked
 */
export async function isBookmarked(
  username: string,
  videoId: string,
): Promise<boolean> {
  const data = await readUserData(username);
  return data.bookmarks.some((b) => b.id === videoId);
}

// ============================================================
// Watch History
// ============================================================

/**
 * Get watch history
 */
export async function getWatchHistory(
  username: string,
): Promise<WatchHistoryItem[]> {
  const data = await readUserData(username);
  return data.watch_history;
}

/**
 * Add to watch history
 */
export async function addToWatchHistory(
  username: string,
  item: Omit<WatchHistoryItem, "watched_at">,
): Promise<void> {
  const data = await readUserData(username);

  // Remove if already exists (we'll re-add at top)
  data.watch_history = data.watch_history.filter((h) => h.id !== item.id);

  // Add to beginning
  data.watch_history.unshift({
    ...item,
    watched_at: new Date().toISOString(),
  });

  // Keep only last 100 items
  data.watch_history = data.watch_history.slice(0, 100);

  await writeUserData(username, data);
}

/**
 * Clear watch history
 */
export async function clearWatchHistory(username: string): Promise<void> {
  const data = await readUserData(username);
  data.watch_history = [];
  await writeUserData(username, data);
}

/**
 * Update playback progress
 */
export async function updateProgress(
  username: string,
  videoId: string,
  progress: number,
): Promise<void> {
  const data = await readUserData(username);
  const item = data.watch_history.find((h) => h.id === videoId);

  if (item) {
    item.progress = progress;
    item.watched_at = new Date().toISOString();
    await writeUserData(username, data);
  }
}

// ============================================================
// Settings
// ============================================================

/**
 * Get settings
 */
export async function getSettings(
  username: string,
): Promise<Record<string, unknown>> {
  const data = await readUserData(username);
  return data.settings;
}

/**
 * Update settings
 */
export async function updateSettings(
  username: string,
  settings: Record<string, unknown>,
): Promise<void> {
  const data = await readUserData(username);
  data.settings = { ...data.settings, ...settings };
  await writeUserData(username, data);
}
