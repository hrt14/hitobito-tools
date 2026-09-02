import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConceptAppPage from "../ConceptAppPage";
import EarHubLauncher from "../EarHubLauncher";
import { catalogById } from "../catalog";

type Props = {
  params: Promise<{ module: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  const app = catalogById(module);
  if (!app) return {};
  return {
    title: `${app.name} | DIGIL CLOUD`,
    description: app.tagline,
  };
}

export default async function DigilCloudAppPage({ params }: Props) {
  const { module } = await params;
  const app = catalogById(module);
  if (!app) notFound();

  if (app.status === "live" && app.moduleId) {
    return <EarHubLauncher moduleId={app.moduleId} />;
  }

  return <ConceptAppPage app={app} />;
}
