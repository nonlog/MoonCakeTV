# Migration Plan: Replace Current API with 采集站 (CaiJi) API

## Executive Summary

This document outlines the plan to replace the current `s1.m3u8.io/v1` API with direct integration of **采集站 (CaiJi) APIs** - the standard Chinese video aggregation API protocol used by TVBox, FongMi, and similar applications.

## Existing Parsing Logic Reference

The parsing logic already exists in the temporal project:

**File:** `/Users/yumin/ventures/mc-stack/temporal/workers-copilot/libs/video-sync.js`

```javascript
// Fetch from CaiJi API
export async function fetch_video_list(base_url, page_number) {
  let normalized_url = base_url;
  if (!base_url.startsWith("http://") && !base_url.startsWith("https://")) {
    normalized_url = `https://${base_url}`;
  }

  const search_params = new URLSearchParams({
    ac: "videolist",
    pagesize: "100",
    pg: page_number,
  });

  const url = `${normalized_url}/api.php/provide/vod/?${search_params.toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  return json;
}

// Transform CaiJi response to Dazahui format
export function transform_to_dazahui(raw) {
  return raw.list.map((vod_item) => ({
    source_vod_id: vod_item.vod_id.toString(),
    source: vod_item.vod_play_from,
    title: vod_item.vod_name,
    // Parse: "ep1$url1#ep2$url2" → { "ep1": "url1", "ep2": "url2" }
    m3u8_urls: Object.fromEntries(
      vod_item.vod_play_url
        .split("#")
        .map((url_item) => url_item.split("$"))
        .filter(([k, v]) => k?.trim() && v?.trim()),
    ),
    language: vod_item.vod_lang,
    cover_image: vod_item.vod_pic,
    year: vod_item.vod_year,
    region: vod_item.vod_area,
    summary: `${vod_item.vod_blurb}\n\n${vod_item.vod_content}`,
    casting: vod_item.vod_actor,
    category: vod_item.type_name,
  }));
}
```

**⚠️ BUG IN CURRENT IMPLEMENTATION:**

The current implementation only parses the **first source** (splits by `#` only). But the actual API returns **multiple sources** separated by `$$`:

```
vod_play_from: "jsyun$$jsm3u8"        // Two sources
vod_play_url:  "ep1$url1#ep2$url2$$ep1$url3#ep2$url4"  // Two source groups
```

The current code does `.split("#")` which breaks when there are multiple sources because:

1. It doesn't split by `$$` first to separate sources
2. It loses the second source entirely

**Correct parsing requires:**

1. Split `vod_play_from` by `$$` → `["jsyun", "jsm3u8"]`
2. Split `vod_play_url` by `$$` → `[source1_episodes, source2_episodes]`
3. Then split each source's episodes by `#` and `$`

---

## Current State

### Current Architecture

```
User → mooncaketv-web → s1.m3u8.io/v1 (Cloudflare Workers) → meili-search-service → PostgreSQL
```

### Current API Endpoints Used

| Endpoint                  | Purpose                |
| ------------------------- | ---------------------- |
| `/v1/search2?keyword=xxx` | Search content         |
| `/v1/random`              | Random recommendations |
| `/v1/mc_item/{mc_id}`     | Get content details    |
| `/v1/douban`              | Douban trending        |

### Current Data Model (`Dazahui`)

```typescript
{
  mc_id: string;
  title: string;
  m3u8_urls: Record<string, string>; // {episode: url}
  cover_image: string;
  year: number;
  region: string;
  summary: string;
  category: string;
  source: string;
  // ...
}
```

---

## Target State

### New Architecture (Simplified)

```
User → mooncaketv-web → 采集站 APIs (direct) → Video Sources
```

**Benefits:**

- Eliminate dependency on `m3u8-s1` Cloudflare Workers
- Eliminate dependency on `meili-search-service`
- Direct access to 86,000+ videos from multiple sources
- Easier to add/remove sources
- Standard protocol used by TVBox ecosystem

---

## 采集站 API Protocol Specification

### API Category 1: Standard CMS API (苹果CMS v10 Protocol)

This is the most common format used by Chinese video aggregation sites.

#### Base URL Pattern

```
https://{domain}/api.php/provide/vod
```

#### Endpoints

**1. List/Search Videos**

```
GET /api.php/provide/vod?ac=videolist&pg={page}
GET /api.php/provide/vod?ac=videolist&wd={keyword}
GET /api.php/provide/vod?ac=videolist&t={type_id}
GET /api.php/provide/vod?ac=videolist&h={hours}  // Updated within X hours
```

**2. Get Video Details**

```
GET /api.php/provide/vod?ac=detail&ids={vod_id}
GET /api.php/provide/vod?ac=detail&ids={id1},{id2},{id3}  // Multiple IDs
```

**3. Get Categories**

```
GET /api.php/provide/vod?ac=list  // Returns category list
```

#### Response Format

```json
{
  "code": 1,
  "msg": "数据列表",
  "page": 1,
  "pagecount": 4343,
  "limit": "20",
  "total": 86843,
  "list": [
    {
      "vod_id": 83082,
      "vod_name": "绝世神皇",
      "vod_sub": "The Death-Defying Divine Emperor",
      "vod_pic": "https://img.example.com/cover.jpg",
      "vod_remarks": "第26集",
      "vod_year": "2025",
      "vod_area": "中国大陆",
      "vod_lang": "汉语普通话",
      "vod_class": "动画,奇幻,中国动漫",
      "vod_actor": "",
      "vod_director": "",
      "vod_content": "剧情简介...",
      "vod_play_from": "jsyun$$jsm3u8",
      "vod_play_url": "第1集$https://...m3u8#第2集$https://...m3u8$$第1集$https://...m3u8#第2集$https://...m3u8",
      "type_name": "中国动漫"
      // ... many more fields
    }
  ]
}
```

#### Play URL Parsing

The `vod_play_url` field uses a special delimiter format:

```
{source1_episodes}$${source2_episodes}$$...

Where each source's episodes:
{episode_name}${url}#{episode_name}${url}#...
```

**Example:**

```
第1集$https://a.com/1.m3u8#第2集$https://a.com/2.m3u8$$第1集$https://b.com/1.m3u8#第2集$https://b.com/2.m3u8
```

**Parsing logic:**

```typescript
function parsePlayUrls(
  vodPlayFrom: string,
  vodPlayUrl: string,
): Record<string, Record<string, string>> {
  const sources = vodPlayFrom.split("$$"); // ["jsyun", "jsm3u8"]
  const urlGroups = vodPlayUrl.split("$$"); // [source1_eps, source2_eps]

  const result: Record<string, Record<string, string>> = {};

  sources.forEach((source, i) => {
    result[source] = {};
    const episodes = urlGroups[i]?.split("#") || [];
    episodes.forEach((ep) => {
      const [name, url] = ep.split("$");
      if (name && url) {
        result[source][name.trim()] = url.trim();
      }
    });
  });

  return result;
  // Returns: { "jsyun": {"第1集": "url1", "第2集": "url2"}, "jsm3u8": {...} }
}
```

---

### API Category 2: TVBox Configuration Format

TVBox uses JSON configuration files to define multiple video sources.

#### Configuration Structure

```json
{
  "spider": "https://example.com/jar/spider.jar",
  "sites": [
    {
      "key": "jisuzy",
      "name": "极速资源",
      "type": 1,
      "api": "https://jisuzy.com/api.php/provide/vod",
      "searchable": 1,
      "quickSearch": 1,
      "filterable": 1
    },
    {
      "key": "custom_spider",
      "name": "自定义源",
      "type": 3,
      "api": "csp_SiteName",
      "jar": "https://example.com/custom.jar",
      "ext": "https://example.com/config.json"
    }
  ],
  "parses": [
    {
      "name": "解析1",
      "type": 0,
      "url": "https://example.com/parse?url="
    }
  ],
  "lives": [
    {
      "name": "直播源",
      "type": 0,
      "url": "https://example.com/live.m3u"
    }
  ]
}
```

#### Site Types

| Type | Description | API Field Usage                                |
| ---- | ----------- | ---------------------------------------------- |
| 0    | XML Format  | `api` = full URL returning XML                 |
| 1    | JSON Format | `api` = full URL returning JSON (Standard CMS) |
| 3    | Spider/JAR  | `api` = class name in JAR file                 |

**For mooncaketv-web, we only need Type 1 (JSON/Standard CMS API)**

---

## Known 采集站 Sources

### Verified Working Sources (as of 2025)

| Name     | API URL                                            | Notes                        |
| -------- | -------------------------------------------------- | ---------------------------- |
| 极速资源 | `https://jisuzy.com/api.php/provide/vod`           | 86,000+ videos, fast updates |
| 量子资源 | `https://cj.lzizy.net/api.php/provide/vod`         | Large library                |
| 酷点资源 | `https://kudian.top/api.php/provide/vod`           | Stable                       |
| 闪电资源 | `https://sdzyapi.com/api.php/provide/vod`          | Fast CDN                     |
| 天空资源 | `https://m3u8.tiankongapi.com/api.php/provide/vod` | M3U8 focused                 |

> **Note:** Sources change frequently. Implement source health checking.

---

## Implementation Plan

### Phase 1: Core API Client

**Files to create:**

```
src/lib/caiji/
├── client.ts        # HTTP client with retry logic
├── types.ts         # TypeScript types for CaiJi API
├── parser.ts        # Play URL parsing utilities
├── sources.ts       # Source configuration
└── index.ts         # Public exports
```

#### 1.1 Type Definitions (`src/lib/caiji/types.ts`)

```typescript
// API Response wrapper
export interface CaijiResponse<T> {
  code: number; // 1 = success
  msg: string;
  page: number;
  pagecount: number;
  limit: string;
  total: number;
  list: T[];
}

// Video item from API
export interface CaijiVod {
  vod_id: number;
  vod_name: string;
  vod_sub: string;
  vod_en: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_area: string;
  vod_lang: string;
  vod_class: string;
  vod_actor: string;
  vod_director: string;
  vod_content: string;
  vod_blurb: string;
  vod_play_from: string;
  vod_play_url: string;
  vod_douban_id: number;
  vod_douban_score: string;
  vod_time: string;
  vod_hits: number;
  type_id: number;
  type_name: string;
  // ... additional fields as needed
}

// Source configuration
export interface CaijiSource {
  key: string;
  name: string;
  api: string;
  enabled: boolean;
  priority: number;
}

// Parsed episode data
export interface ParsedEpisodes {
  [sourceName: string]: {
    [episodeName: string]: string; // url
  };
}

// Normalized video item for frontend
export interface NormalizedVod {
  id: string; // `${sourceKey}_${vod_id}`
  sourceKey: string;
  sourceVodId: number;
  title: string;
  subtitle: string;
  cover: string;
  remarks: string;
  year: string;
  area: string;
  language: string;
  categories: string[];
  actors: string[];
  directors: string[];
  summary: string;
  episodes: ParsedEpisodes;
  doubanId: number | null;
  doubanScore: number | null;
  updatedAt: string;
  hits: number;
  typeName: string;
}
```

#### 1.2 API Client (`src/lib/caiji/client.ts`)

```typescript
import { CaijiResponse, CaijiVod, CaijiSource } from "./types";

export class CaijiClient {
  private source: CaijiSource;
  private timeout: number;

  constructor(source: CaijiSource, timeout = 10000) {
    this.source = source;
    this.timeout = timeout;
  }

  async search(keyword: string, page = 1): Promise<CaijiResponse<CaijiVod>> {
    const url = `${this.source.api}?ac=videolist&wd=${encodeURIComponent(keyword)}&pg=${page}`;
    return this.fetch(url);
  }

  async list(page = 1, typeId?: number): Promise<CaijiResponse<CaijiVod>> {
    let url = `${this.source.api}?ac=videolist&pg=${page}`;
    if (typeId) url += `&t=${typeId}`;
    return this.fetch(url);
  }

  async getDetail(vodId: number): Promise<CaijiResponse<CaijiVod>> {
    const url = `${this.source.api}?ac=detail&ids=${vodId}`;
    return this.fetch(url);
  }

  async getRecent(hours = 24): Promise<CaijiResponse<CaijiVod>> {
    const url = `${this.source.api}?ac=videolist&h=${hours}`;
    return this.fetch(url);
  }

  private async fetch<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MoonCakeTV/1.0)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

#### 1.3 URL Parser (`src/lib/caiji/parser.ts`)

```typescript
import { CaijiVod, ParsedEpisodes, NormalizedVod } from "./types";

export function parsePlayUrls(
  vodPlayFrom: string,
  vodPlayUrl: string,
): ParsedEpisodes {
  const sources = vodPlayFrom.split("$$").filter(Boolean);
  const urlGroups = vodPlayUrl.split("$$");

  const result: ParsedEpisodes = {};

  sources.forEach((source, i) => {
    result[source] = {};
    const episodes = urlGroups[i]?.split("#") || [];

    episodes.forEach((ep) => {
      const delimiterIndex = ep.indexOf("$");
      if (delimiterIndex > 0) {
        const name = ep.substring(0, delimiterIndex).trim();
        const url = ep.substring(delimiterIndex + 1).trim();
        if (name && url && url.startsWith("http")) {
          result[source][name] = url;
        }
      }
    });
  });

  return result;
}

export function normalizeVod(vod: CaijiVod, sourceKey: string): NormalizedVod {
  return {
    id: `${sourceKey}_${vod.vod_id}`,
    sourceKey,
    sourceVodId: vod.vod_id,
    title: vod.vod_name,
    subtitle: vod.vod_sub || "",
    cover: vod.vod_pic,
    remarks: vod.vod_remarks,
    year: vod.vod_year,
    area: vod.vod_area,
    language: vod.vod_lang,
    categories: vod.vod_class?.split(",").filter(Boolean) || [],
    actors: vod.vod_actor?.split(",").filter(Boolean) || [],
    directors: vod.vod_director?.split(",").filter(Boolean) || [],
    summary: vod.vod_content || vod.vod_blurb || "",
    episodes: parsePlayUrls(vod.vod_play_from, vod.vod_play_url),
    doubanId: vod.vod_douban_id || null,
    doubanScore: vod.vod_douban_score ? parseFloat(vod.vod_douban_score) : null,
    updatedAt: vod.vod_time,
    hits: vod.vod_hits,
    typeName: vod.type_name,
  };
}

// Get M3U8 URL (prefer direct m3u8 sources)
export function getPreferredPlayUrl(
  episodes: ParsedEpisodes,
  episodeName: string,
): string | null {
  // Priority: sources with 'm3u8' in name > others
  const sourceKeys = Object.keys(episodes);
  const m3u8Sources = sourceKeys.filter((k) =>
    k.toLowerCase().includes("m3u8"),
  );
  const otherSources = sourceKeys.filter(
    (k) => !k.toLowerCase().includes("m3u8"),
  );

  for (const source of [...m3u8Sources, ...otherSources]) {
    const url = episodes[source]?.[episodeName];
    if (url) return url;
  }

  return null;
}
```

---

### Phase 2: Source Management

**File: `src/lib/caiji/sources.ts`**

```typescript
import { CaijiSource } from "./types";

// Default sources - can be overridden by user config
export const DEFAULT_SOURCES: CaijiSource[] = [
  {
    key: "jisuzy",
    name: "极速资源",
    api: "https://jisuzy.com/api.php/provide/vod",
    enabled: true,
    priority: 1,
  },
  {
    key: "lzizy",
    name: "量子资源",
    api: "https://cj.lzizy.net/api.php/provide/vod",
    enabled: true,
    priority: 2,
  },
  // Add more sources as needed
];

// Health check for a source
export async function checkSourceHealth(source: CaijiSource): Promise<boolean> {
  try {
    const response = await fetch(`${source.api}?ac=videolist&pg=1`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data.code === 1 && Array.isArray(data.list);
  } catch {
    return false;
  }
}
```

---

### Phase 3: API Routes

Replace/add these Next.js API routes:

#### 3.1 Search API (`src/app/api/caiji/search/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { CaijiClient } from "@/lib/caiji/client";
import { normalizeVod } from "@/lib/caiji/parser";
import { DEFAULT_SOURCES } from "@/lib/caiji/sources";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");
  const page = parseInt(searchParams.get("page") || "1");
  const sourceKey = searchParams.get("source");

  if (!keyword) {
    return NextResponse.json({ code: 400, message: "keyword required" });
  }

  const sources = sourceKey
    ? DEFAULT_SOURCES.filter((s) => s.key === sourceKey)
    : DEFAULT_SOURCES.filter((s) => s.enabled);

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const client = new CaijiClient(source);
      const response = await client.search(keyword, page);
      return {
        source: source.key,
        sourceName: source.name,
        total: response.total,
        items: response.list.map((vod) => normalizeVod(vod, source.key)),
      };
    }),
  );

  const successResults = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .map((r) => r.value);

  return NextResponse.json({
    code: 200,
    data: {
      keyword,
      page,
      results: successResults,
    },
  });
}
```

#### 3.2 Detail API (`src/app/api/caiji/detail/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { CaijiClient } from "@/lib/caiji/client";
import { normalizeVod } from "@/lib/caiji/parser";
import { DEFAULT_SOURCES } from "@/lib/caiji/sources";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id"); // Format: sourceKey_vodId

  if (!id) {
    return NextResponse.json({ code: 400, message: "id required" });
  }

  const [sourceKey, vodIdStr] = id.split("_");
  const vodId = parseInt(vodIdStr);

  if (!sourceKey || isNaN(vodId)) {
    return NextResponse.json({ code: 400, message: "invalid id format" });
  }

  const source = DEFAULT_SOURCES.find((s) => s.key === sourceKey);
  if (!source) {
    return NextResponse.json({ code: 404, message: "source not found" });
  }

  try {
    const client = new CaijiClient(source);
    const response = await client.getDetail(vodId);

    if (!response.list?.[0]) {
      return NextResponse.json({ code: 404, message: "video not found" });
    }

    return NextResponse.json({
      code: 200,
      data: normalizeVod(response.list[0], sourceKey),
    });
  } catch (error) {
    return NextResponse.json({ code: 500, message: "fetch failed" });
  }
}
```

#### 3.3 Random/Recent API (`src/app/api/caiji/recent/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { CaijiClient } from "@/lib/caiji/client";
import { normalizeVod } from "@/lib/caiji/parser";
import { DEFAULT_SOURCES } from "@/lib/caiji/sources";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hours = parseInt(searchParams.get("hours") || "24");
  const limit = parseInt(searchParams.get("limit") || "20");

  const source = DEFAULT_SOURCES.find((s) => s.enabled);
  if (!source) {
    return NextResponse.json({ code: 500, message: "no source available" });
  }

  try {
    const client = new CaijiClient(source);
    const response = await client.getRecent(hours);

    // Shuffle and limit for "random" effect
    const shuffled = response.list
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);

    return NextResponse.json({
      code: 200,
      data: {
        items: shuffled.map((vod) => normalizeVod(vod, source.key)),
      },
    });
  } catch (error) {
    return NextResponse.json({ code: 500, message: "fetch failed" });
  }
}
```

---

### Phase 4: Frontend Updates

#### 4.1 Update Search Component

Update `src/components/search-page/index.tsx` to use new API:

```typescript
// Before
const res = await fetch(
  `https://s1.m3u8.io/v1/search2?keyword=${encodeURIComponent(term)}`,
);

// After
const res = await fetch(
  `/api/caiji/search?keyword=${encodeURIComponent(term)}`,
);
```

#### 4.2 Update Play Page

Update `src/app/play/page.tsx` to use new detail API:

```typescript
// Before
const res = await fetch(`https://s1.m3u8.io/v1/mc_item/${mcId}`);

// After
const res = await fetch(`/api/caiji/detail?id=${mcId}`);
```

#### 4.3 Update Data Types

Map `NormalizedVod` to existing `Dazahui` type or create adapter:

```typescript
// src/lib/caiji/adapter.ts
import { NormalizedVod } from "./types";
import { Dazahui } from "@/schemas/dazahui";

export function vodToDazahui(vod: NormalizedVod): Dazahui {
  // Get first source's episodes as m3u8_urls
  const firstSource = Object.keys(vod.episodes)[0];
  const m3u8_urls = firstSource ? vod.episodes[firstSource] : {};

  return {
    id: 0, // Not used with new system
    mc_id: vod.id,
    title: vod.title,
    m3u8_urls,
    language: vod.language,
    cover_image: vod.cover,
    year: vod.year ? parseInt(vod.year) : null,
    region: vod.area,
    summary: vod.summary,
    casting: vod.actors.join(","),
    category: vod.categories[0] || null,
    source_vod_id: String(vod.sourceVodId),
    source: vod.sourceKey,
    douban_id: vod.doubanId ? String(vod.doubanId) : "",
    imdb_id: "",
    tmdb_id: "",
  };
}
```

---

### Phase 5: Advanced Features (Optional)

#### 5.1 Multi-Source Aggregation

Search across all sources and deduplicate by title:

```typescript
async function aggregateSearch(keyword: string): Promise<NormalizedVod[]> {
  const allResults = await searchAllSources(keyword);

  // Dedupe by title similarity
  const seen = new Map<string, NormalizedVod>();
  for (const vod of allResults) {
    const key = normalizeTitle(vod.title);
    if (!seen.has(key) || vod.episodes > seen.get(key)!.episodes) {
      seen.set(key, vod);
    }
  }

  return Array.from(seen.values());
}
```

#### 5.2 Source Health Monitoring

Background job to check source availability:

```typescript
// src/app/api/cron/check-sources/route.ts
export async function GET() {
  const results = await Promise.all(
    DEFAULT_SOURCES.map(async (source) => ({
      key: source.key,
      healthy: await checkSourceHealth(source),
    })),
  );

  // Store results in memory/KV for quick lookup
  return NextResponse.json({ sources: results });
}
```

#### 5.3 TVBox Config Import

Allow users to import TVBox configuration files:

```typescript
// src/app/api/caiji/import-config/route.ts
export async function POST(request: NextRequest) {
  const { configUrl } = await request.json();

  const config = await fetch(configUrl).then((r) => r.json());

  // Extract type=1 sites (JSON API)
  const jsonSites = config.sites?.filter((s) => s.type === 1) || [];

  // Validate and add to user's sources
  // ...
}
```

---

## Migration Checklist

### Pre-Migration

- [ ] Create `src/lib/caiji/` directory and files
- [ ] Add types, client, parser, sources
- [ ] Test with single source (jisuzy)

### Phase 1: Parallel Operation

- [ ] Create new `/api/caiji/*` routes
- [ ] Keep existing `/v1/*` proxy working
- [ ] Add feature flag to switch between APIs

### Phase 2: Frontend Migration

- [ ] Update search page to use new API
- [ ] Update play page to use new API
- [ ] Update home page random content
- [ ] Test all playback scenarios

### Phase 3: Cleanup

- [ ] Remove old API proxy code
- [ ] Remove dependency on `s1.m3u8.io`
- [ ] Update documentation

### Phase 4: Enhancement

- [ ] Add multi-source support
- [ ] Add source health monitoring
- [ ] Add TVBox config import (optional)

---

## Risk Mitigation

### Source Reliability

- **Risk:** 采集站 APIs can go offline
- **Mitigation:** Support multiple sources, implement fallback logic

### CORS Issues

- **Risk:** Direct browser calls may be blocked
- **Mitigation:** All API calls go through Next.js API routes (server-side)

### Rate Limiting

- **Risk:** Sources may rate limit requests
- **Mitigation:** Implement request throttling, caching

### Content Changes

- **Risk:** API format may change
- **Mitigation:** Defensive parsing, error boundaries

---

## Appendix: Common Category Type IDs

| type_id | Category           |
| ------- | ------------------ |
| 1       | 电影               |
| 2       | 连续剧             |
| 3       | 综艺               |
| 4       | 动漫               |
| 5       | 纪录片             |
| 6       | 体育               |
| ...     | (varies by source) |

> Note: Category IDs vary between sources. Query `/api.php/provide/vod?ac=list` to get source-specific categories.

---

## References

- [苹果CMS v10 API 文档](https://www.maccms.la/)
- [TVBox 配置格式说明](https://github.com/liu673cn/box)
- [gaotianliuyun/gao](https://github.com/gaotianliuyun/gao) - Example configurations
