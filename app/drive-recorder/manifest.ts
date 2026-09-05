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
        src: "/drive-recorder/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
