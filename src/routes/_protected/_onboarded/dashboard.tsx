import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/_onboarded/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/org" });
  },
});
