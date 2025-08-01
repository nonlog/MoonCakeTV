export type Region =
  | "中国"
  | "美国"
  | "英国"
  | "欧美"
  | "日本"
  | "韩国"
  | "泰国"
  | "马来西亚"
  | "台湾"
  | "香港"
  | "新加坡";

export type Language =
  | "中文"
  | "英文"
  | "日文"
  | "韩文"
  | "泰文"
  | "台语"
  | "粤语";

// use OR, not AND
export type Category =
  | "电视剧"
  | "电影"
  | "欧美剧"
  | "香港剧"
  | "韩剧"
  | "日剧"
  | "马泰剧"
  | "伦理片"
  | "动作片"
  | "爱情片"
  | "喜剧片"
  | "科幻片"
  | "恐怖片"
  | "剧情片"
  | "连续剧"
  | "综艺片"
  | "动漫"
  | "纪录片"
  | "战争片"
  | "国产剧"
  | "动漫电影"
  | "泰国剧"
  | "日本剧"
  | "台湾剧"
  | "海外剧"
  | "大陆综艺"
  | "日韩综艺"
  | "港台综艺"
  | "欧美综艺"
  | "演唱会"
  | "国产动漫"
  | "日本动漫"
  | "欧美动漫"
  | "海外动漫"
  | "新闻资讯"
  | "体育赛事"
  | "短剧大全"
  | "篮球"
  | "足球"
  | "网球"
  | "斯诺克"
  | "LPL"
  | "重生民国"
  | "穿越现代"
  | "反转爽剧"
  | "言情总裁"
  | "现代都市"
  | "古装仙侠"
  | "悬疑烧脑"
  | "惊悚片"
  | "电影资讯"
  | "娱乐新闻"
  | "战争片"
  | "记录片"
  | "动漫"
  | "内地剧"
  | "动画片"
  | "中国动漫"
  | "日本动漫"
  | "欧美动漫"
  | "综艺"
  | "台湾剧"
  | "体育赛事"
  | "大陆综艺"
  | "日韩综艺"
  | "港台综艺"
  | "欧美综艺"
  | "灾难片"
  | "悬疑片"
  | "犯罪片"
  | "奇幻片"
  | "短剧";

// Search filter interfaces
export interface SearchFilters {
  title?: string;
  page?: number;
  page_size?: 10 | 20 | 50 | 100;
  category?: Category;
  region?: Region;
  language?: Language;
}

// 搜索结果数据结构
export interface SearchResult {
  id: string;
  title: string;
  poster: string;
  episodes: string[];
  source: string;
  source_name: string;
  class?: string;
  year: string;
  desc?: string;
  type_name?: string;
  douban_id?: number;
}

// Search response structure
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  sources: string[]; // Which sources were searched
}
