import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TwoLanguageTranslatePage from "../TwoLanguageTranslatePage";
import MinutesPage from "../MinutesPage";
import ConceptAppPage from "../ConceptAppPage";
import EarhonyaProduct from "../EarhonyaProduct";
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
    alternates: {
      canonical: `https://dc.hitobito.jp/${app.id}`,
    },
  };
}

export default async function DigilCloudAppPage({ params }: Props) {
  const { module } = await params;
  const app = catalogById(module);
  if (!app) notFound();

  if (app.id === "translate") {
    return <TwoLanguageTranslatePage />;
  }

  if (app.id === "minutes") {
    return <MinutesPage />;
  }

  if (app.id === "earhonya") {
    return <EarhonyaProduct />;
  }

  if (app.status === "live" && app.moduleId) {
    return <EarHubLauncher moduleId={app.moduleId} />;
  }

  return <ConceptAppPage app={app} />;
}
