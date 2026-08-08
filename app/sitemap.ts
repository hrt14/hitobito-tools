import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: "https://hitobito.jp",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://hitobito.jp/2100",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://hitobito.jp/2100/monday-gravity-bag",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
