import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Input } from "#/components/ui/input";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_protected/_onboarded/org/settings")({
  component: OrgSettingsPage,
});

function OrgSettingsPage() {
  const { activeOrg } = Route.useRouteContext();
  const { data: activeMember } = authClient.useActiveMember();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isOwner = activeMember?.role === "owner";

  const settingsSchema = z.object({
    name: z.string().min(1, m.validation_name_required()),
    slug: z.string().min(1, m.validation_field_required()),
    logo: z.string(),
  });

  const form = useForm({
    defaultValues: {
      name: activeOrg?.name ?? "",
      slug: activeOrg?.slug ?? "",
      logo: activeOrg?.logo ?? "",
    },
    validators: {
      onSubmit: settingsSchema,
      onBlur: settingsSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: updateError } = await authClient.organization.update({
        data: {
          name: value.name,
          slug: value.slug,
          logo: value.logo || undefined,
        },
      });

      if (updateError) {
        toast.error(updateError.message ?? m.org_settings_update_failed());
        return;
      }

      toast.success(m.org_settings_update_success());
    },
  });

  const handleDelete = async () => {
    if (!activeOrg) return;
    setDeleteLoading(true);

    const { error: deleteError } = await authClient.organization.delete({
      organizationId: activeOrg.id,
    });

    setDeleteLoading(false);

    if (deleteError) {
      toast.error(deleteError.message ?? m.org_settings_delete_failed());
      return;
    }

    toast.success(m.org_settings_delete_success());
    setDeleteOpen(false);
    navigate({ to: "/org" });
  };

  if (!activeOrg) return null;

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/org" />}>
                  {m.org_nav_dashboard()}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{m.org_settings_title()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="mb-6 text-2xl font-bold">
            {m.org_settings_title()}
          </h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{m.org_settings_general()}</CardTitle>
              <CardDescription>
                {m.org_settings_description()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void form.handleSubmit();
                }}
                className="flex flex-col gap-4"
              >
                <form.Field name="name">
                  {(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="settings-name">
                          {m.common_label_name()}
                        </FieldLabel>
                        <Input
                          id="settings-name"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="slug">
                  {(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="settings-slug">
                          {m.common_label_slug()}
                        </FieldLabel>
                        <Input
                          id="settings-slug"
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]/g, ""),
                            )
                          }
                          onBlur={field.handleBlur}
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="logo">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="settings-logo">
                        {m.org_label_logo_url()}
                      </FieldLabel>
                      <Input
                        id="settings-logo"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={m.org_placeholder_logo_url()}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="self-end"
                    >
                      {isSubmitting
                        ? m.common_saving()
                        : m.common_save_changes()}
                    </Button>
                  )}
                </form.Subscribe>
              </form>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  {m.org_danger_zone()}
                </CardTitle>
                <CardDescription>
                  {m.org_danger_zone_org_description()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  {m.org_delete_org()}
                </Button>
              </CardContent>
            </Card>
          )}

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{m.org_delete_org()}</AlertDialogTitle>
                <AlertDialogDescription>
                  {m.org_delete_org_confirm({ name: activeOrg.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? m.common_deleting() : m.org_delete_org()}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}
