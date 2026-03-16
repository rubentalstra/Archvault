import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "#/components/ui/breadcrumb";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";
import { m } from "#/paraglide/messages";
import { getOtelSettings } from "#/lib/settings.functions";
import { OtelSettingsForm } from "#/components/admin/otel-settings-form";

export const Route = createFileRoute("/_protected/admin/observability")({
  component: ObservabilityPage,
});

function ObservabilityPage() {
  const getOtelSettingsFn = useServerFn(getOtelSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "otel-settings"],
    queryFn: () => getOtelSettingsFn(),
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{m.admin_otel_title()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div>
          <h2 className="text-2xl font-bold">{m.admin_otel_title()}</h2>
          <p className="text-sm text-muted-foreground">
            {m.admin_otel_description()}
          </p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">{m.common_loading()}</p>
        ) : data ? (
          <OtelSettingsForm initialData={data} />
        ) : null}
      </div>
    </>
  );
}
