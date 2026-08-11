import { notFound } from "next/navigation";

export default function Page() {
  // Keep contracts code available for future scope without exposing it in V1.
  // Mirrors the CRM block below; contract templates/records continue to be
  // created automatically by subscriptions and clinic onboarding regardless
  // of this page being reachable.
  notFound();
}
