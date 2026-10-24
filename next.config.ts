import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

export default nextConfig;

// `next dev` から Cloudflare のバインディング(環境変数など)を参照できるようにする。
initOpenNextCloudflareForDev();
