import ProtectedFeaturePlaceholder from "@/app/components/ProtectedFeaturePlaceholder";

export default function CalendarPage() {
  return (
    <ProtectedFeaturePlaceholder
      eyebrow="Independent Module"
      title="Calendar"
      description="A dedicated page for schedules, activities, timelines, and future planning views for the Mt. Hamiguitan internal workspace."
      detail="This module is intentionally positioned as its own first-level page. It is ready to grow into a calendar workspace for events, deadlines, field coordination, and protected area scheduling."
    />
  );
}
