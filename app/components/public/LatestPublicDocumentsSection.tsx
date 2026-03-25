import { listLatestPublicMinutesAndResolutions } from "@/app/lib/publicDocuments";
import LatestPublicDocumentsShowcase from "@/app/components/public/LatestPublicDocumentsShowcase";

export default async function LatestPublicDocumentsSection() {
  const latestPublicDocuments = await listLatestPublicMinutesAndResolutions();

  return <LatestPublicDocumentsShowcase documents={latestPublicDocuments} />;
}
