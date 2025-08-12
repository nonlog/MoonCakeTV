const tags = {
  show: [
    "热门",
    "最新",
    "经典",
    "可播放",
    "豆瓣高分",
    "冷门佳片",
    "华语",
    "欧美",
    "韩国",
    "日本",
    "动作",
    "喜剧",
    "爱情",
    "科幻",
    "悬疑",
    "恐怖",
    "成长",
  ],
  tv: [
    "热门",
    "美剧",
    "英剧",
    "韩剧",
    "日剧",
    "国产剧",
    "港剧",
    "日本动画",
    "综艺",
    "纪录片",
  ],
  movie: [
    "热门",
    "最新",
    "经典",
    "可播放",
    "豆瓣高分",
    "冷门佳片",
    "华语",
    "欧美",
    "韩国",
    "日本",
    "动作",
    "喜剧",
    "爱情",
    "科幻",
    "悬疑",
    "恐怖",
    "文艺",
  ],
  cartoon: [
    "热门",
    "最新",
    "经典",
    "可播放",
    "豆瓣高分",
    "冷门佳片",
    "华语",
    "欧美",
    "韩国",
    "日本",
    "动作",
    "喜剧",
    "爱情",
    "科幻",
    "悬疑",
    "恐怖",
    "动画",
  ],
  animation: [
    "热门",
    "最新",
    "经典",
    "可播放",
    "豆瓣高分",
    "冷门佳片",
    "华语",
    "欧美",
    "韩国",
    "日本",
    "动作",
    "喜剧",
    "爱情",
    "科幻",
    "悬疑",
    "恐怖",
    "成长",
  ],
};

type DoubanMediaType = keyof typeof tags;

// const search_tag_url = `https://movie.douban.com/j/search_tags?type=${type}`;

const base_api = "https://movie.douban.com/j/search_subjects";

export const fetchDoubanByType = async (params: { type: DoubanMediaType }) => {
  const type_tags = tags[params.type];
  const urls = type_tags.map((_tag) => {
    const searchParams = new URLSearchParams();
    searchParams.set("type", params.type);
    searchParams.set("tag", _tag);
    searchParams.set("sort", "recommend");
    searchParams.set("page_limit", "20");
    searchParams.set("page_start", "0");
    return `${base_api}?${searchParams.toString()}`;
  });

  const results = await Promise.all(
    urls.map((_url) => fetch(_url).then((res) => res.json())),
  );
};
