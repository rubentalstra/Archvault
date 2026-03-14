import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { toast } from "sonner";

interface InvitationData {
  organizationName: string;
  inviterEmail: string;
  role: string;
  status: string;
}

export const Route = createFileRoute(
  "/_protected/accept-invitation/$invitationId",
)({
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { invitationId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: invitation, isLoading: fetching } = useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: async () => {
      const { data, error: fetchError } =
        await authClient.organization.getInvitation({
          query: { id: invitationId },
        });
      if (fetchError || !data) return null;
      return data as unknown as InvitationData;
    },
  });

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    const { error: acceptError } =
      await authClient.organization.acceptInvitation({
        invitationId,
      });

    setLoading(false);

    if (acceptError) {
      setError(acceptError.message ?? "Failed to accept invitation");
      return;
    }

    toast.success("Invitation accepted!");
    navigate({ to: "/dashboard" });
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);

    const { error: rejectError } =
      await authClient.organization.rejectInvitation({
        invitationId,
      });

    setLoading(false);

    if (rejectError) {
      setError(rejectError.message ?? "Failed to reject invitation");
      return;
    }

    toast.success("Invitation declined");
    navigate({ to: "/dashboard" });
  };

  if (fetching) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading invitation...</p>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation may have expired or already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate({ to: "/dashboard" })}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join an organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold">
              {invitation.organizationName}
            </p>
            <p className="text-sm text-muted-foreground">
              Invited by {invitation.inviterEmail}
            </p>
            <Badge variant="outline" className="mt-2">
              {invitation.role}
            </Badge>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <Button onClick={handleAccept} disabled={loading}>
              {loading ? "Processing..." : "Accept"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={loading}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
