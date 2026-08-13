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
      url: "https://tools.hitobito.jp",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://games.hitobito.jp",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://life1.hitobito.jp",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://2100.hitobito.jp",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
