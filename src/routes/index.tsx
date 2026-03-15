import { createFileRoute, Link } from "@tanstack/react-router";
import { m } from "#/paraglide/messages";
import { buttonVariants } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { ArchvaultLogo } from "#/components/archvault-logo";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <ArchvaultLogo className="size-10" />
          </div>
          <CardTitle className="text-3xl font-bold">{m.common_app_name()}</CardTitle>
          <CardDescription>
            {m.auth_landing_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link className={buttonVariants()} to="/login">
            {m.auth_sign_in()}
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} to="/signup">
            {m.auth_sign_up_title()}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
