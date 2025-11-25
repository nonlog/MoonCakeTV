// Types
export type {
  AggregatedSearchResult,
  CaijiResponse,
  CaijiSearchParams,
  CaijiSource,
  CaijiVod,
  NormalizedVod,
  ParsedEpisodes,
} from "./types";

// Client
export { CaijiClient } from "./client";

// Parser utilities
export {
  flattenEpisodes,
  getAllEpisodeNames,
  getPreferredPlayUrl,
  normalizeVod,
  parsePlayUrls,
} from "./parser";

// Source management
export {
  checkSourceHealth,
  clearSourcesCache,
  DEFAULT_SOURCES,
  getCachedSources,
  getEnabledSources,
  getSourceByKey,
  parseSourcesFromText,
  setSourcesCache,
  sourcesToText,
} from "./sources";

// Adapter for compatibility with existing Dazahui type
export { vodsToDazahui,vodToDazahui } from "./adapter";

// Load sources from user settings
export { loadSourcesFromSettings } from "./load-sources";
