import ProtectedFeaturePlaceholder from "@/app/components/ProtectedFeaturePlaceholder";

export default function OrganizationalChartPage() {
  return (
    <ProtectedFeaturePlaceholder
      eyebrow="Independent Module"
      title="Organizational Chart"
      description="A dedicated page for institutional structure, reporting lines, and future organizational references inside the authenticated workspace."
      detail="This module is positioned as its own first-level page so future organizational content, staff structure, and unit relationships can expand independently."
    />
  );
}
