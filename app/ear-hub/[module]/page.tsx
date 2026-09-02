import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EarHubLauncher from "../EarHubLauncher";
import { moduleById, type ModuleId } from "../modules";

const MODULE_IDS: ModuleId[] = ["translate", "minutes", "watchword"];

type Props = {
  params: Promise<{ module: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  if (!MODULE_IDS.includes(module as ModuleId)) return {};
  const item = moduleById(module as ModuleId);
  return {
    title: `${item.name} | Ear Hub`,
    description: item.tagline,
  };
}

export default async function EarHubModulePage({ params }: Props) {
  const { module } = await params;
  if (!MODULE_IDS.includes(module as ModuleId)) notFound();

  return <EarHubLauncher moduleId={module as ModuleId} />;
}
