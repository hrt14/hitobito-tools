import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Drive Recorder by hitobito Tools",
    short_name: "Drive Recorder",
    description: "録音した音声を指定したGoogle Driveフォルダへ保存するボイスレコーダー。",
    start_url: "/drive-recorder",
    scope: "/drive-recorder",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d100e",
    theme_color: "#0d100e",
    icons: [
      {
        src: "/drive-recorder/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/drive-recorder/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
