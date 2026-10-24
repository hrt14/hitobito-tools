import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// ISR / revalidate を使っていないので、ビルド時に生成したページは静的アセットから返す。
// R2 や KV を用意せずに済む。revalidate を使い始めたら R2 キャッシュへ切り替えること。
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
