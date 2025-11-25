# 采集站 (CaiJi) API - 苹果CMS v10 Protocol

## Overview

mooncaketv-web uses **采集站 (CaiJi) APIs** with the **苹果CMS v10** protocol for video content aggregation.

## API Protocol

### Base URL Pattern

```
https://{domain}/api.php/provide/vod
```

### Endpoints

**Search Videos**

```
GET /api.php/provide/vod?ac=videolist&wd={keyword}&pg={page}
```

**Get Video Details**

```
GET /api.php/provide/vod?ac=detail&ids={vod_id}
```

**List Recent Videos**

```
GET /api.php/provide/vod?ac=videolist&h={hours}
```

### Response Format

```json
{
  "code": 1,
  "msg": "数据列表",
  "page": 1,
  "pagecount": 100,
  "total": 86843,
  "list": [
    {
      "vod_id": 83082,
      "vod_name": "电影名称",
      "vod_pic": "https://img.example.com/cover.jpg",
      "vod_play_from": "source1$source2",
      "vod_play_url": "第1集$url1#第2集$url2$第1集$url3#第2集$url4"
    }
  ]
}
```

### Play URL Parsing

The `vod_play_url` uses delimiters:

- `$` separates sources
- `#` separates episodes within a source
- `$` separates episode name from URL

**Example:**

```
vod_play_from: "jsyun$jsm3u8"
vod_play_url:  "第1集$https://a.com/1.m3u8#第2集$https://a.com/2.m3u8$第1集$https://b.com/1.m3u8"
```

## Default Sources

| Name     | Domain     |
| -------- | ---------- |
| 茅台资源 | mtzy.tv    |
| 极速资源 | jisuzy.com |

## Configuration

Users can configure sources in Settings. Format: `名称 域名` (space-separated, one per line).

```
茅台资源 mtzy.tv
极速资源 jisuzy.com
# 注释行会被忽略
```

## Implementation Files

```
src/lib/caiji/
├── types.ts      # TypeScript types
├── client.ts     # HTTP client
├── parser.ts     # URL parsing
├── sources.ts    # Source management
├── adapter.ts    # Dazahui compatibility
└── index.ts      # Exports

src/app/api/caiji/
├── search/route.ts   # /api/caiji/search
├── detail/route.ts   # /api/caiji/detail
├── recent/route.ts   # /api/caiji/recent
└── sources/route.ts  # /api/caiji/sources
```

## Finding Sources

Visit [饭太硬](https://www.xn--sss604efuw.com/) to find 苹果CMS v10 compatible sources.
