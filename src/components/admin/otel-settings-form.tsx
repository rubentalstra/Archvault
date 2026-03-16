import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { Badge } from "#/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { m } from "#/paraglide/messages";
import type {
  ResolvedOtelConfig,
  ResolvedOtelConfigWithSources,
} from "#/lib/settings.cache";
import {
  updateOtelSettings,
  testOtelConnection,
} from "#/lib/settings.functions";
import type { OtelAuthType } from "#/lib/settings.validators";

interface OtelSettingsFormProps {
  initialData: ResolvedOtelConfigWithSources;
}

function SourceBadge({ source }: { source: "env" | "db" }) {
  if (source === "env") return null;
  return (
    <Badge variant="outline" className="text-xs font-normal">
      {m.admin_otel_source_db()}
    </Badge>
  );
}

function RestartBadge() {
  return (
    <Badge variant="secondary" className="text-xs font-normal">
      {m.admin_otel_requires_restart()}
    </Badge>
  );
}

function StatusSummary({ config }: { config: ResolvedOtelConfig }) {
  const signals: string[] = [];
  if (config.enabled) signals.push(m.admin_otel_signal_traces());
  if (config.enabled) signals.push(m.admin_otel_signal_metrics());
  if (config.logsEnabled) signals.push(m.admin_otel_signal_logs());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-muted-foreground" />
          <div className="flex-1">
            <CardTitle className="text-base">
              {m.admin_otel_status_summary()}
            </CardTitle>
            <CardDescription className="mt-1 space-x-2">
              {config.endpoint ? (
                <span>
                  {m.admin_otel_status_endpoint()}: {config.endpoint}
                </span>
              ) : (
                <span className="text-amber-600">
                  {m.admin_otel_status_no_endpoint()}
                </span>
              )}
            </CardDescription>
          </div>
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled
              ? m.admin_otel_status_active()
              : m.admin_otel_status_inactive()}
          </Badge>
        </div>
        {config.enabled && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">
              {m.admin_otel_status_auth()}: {config.authType}
            </Badge>
            {signals.map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

export function OtelSettingsForm({ initialData }: OtelSettingsFormProps) {
  const queryClient = useQueryClient();
  const testConnectionFn = useServerFn(testOtelConnection);
  const [isTesting, setIsTesting] = useState(false);
  const [customHeaders, setCustomHeaders] = useState<
    { key: string; value: string }[]
  >(() => {
    const h = initialData.config.customHeaders;
    const entries = Object.entries(h);
    return entries.length > 0
      ? entries.map(([key, value]) => ({ key, value }))
      : [];
  });

  const form = useForm({
    defaultValues: {
      enabled: initialData.config.enabled,
      endpoint: initialData.config.endpoint,
      serviceName: initialData.config.serviceName,
      sampleRate: initialData.config.sampleRate,
      exportInterval: initialData.config.exportInterval,
      consoleExporter: initialData.config.consoleExporter,
      authType: initialData.config.authType,
      bearerToken: initialData.config.bearerToken,
      basicUser: initialData.config.basicUser,
      basicPass: initialData.config.basicPass,
      apiKeyHeader: initialData.config.apiKeyHeader,
      apiKeyValue: initialData.config.apiKeyValue,
      tlsCaCertPath: initialData.config.tlsCaCertPath,
      tlsClientCertPath: initialData.config.tlsClientCertPath,
      tlsClientKeyPath: initialData.config.tlsClientKeyPath,
      tlsInsecureSkipVerify: initialData.config.tlsInsecureSkipVerify,
      logsEnabled: initialData.config.logsEnabled,
    },
    onSubmit: async ({ value }) => {
      try {
        const headersRecord: Record<string, string> = {};
        for (const h of customHeaders) {
          if (h.key.trim()) {
            headersRecord[h.key.trim()] = h.value;
          }
        }

        await updateOtelSettings({
          data: {
            ...value,
            customHeaders: headersRecord,
          },
        });

        void queryClient.invalidateQueries({
          queryKey: ["admin", "otel-settings"],
        });
        toast.success(m.admin_otel_save_success());
      } catch {
        toast.error(m.admin_otel_save_failed());
      }
    },
  });

  const sources = initialData.sources;

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testConnectionFn();
      if (result.success) {
        toast.success(m.admin_otel_test_success(), {
          icon: <CheckCircle2 className="size-4" />,
        });
      } else {
        toast.error(m.admin_otel_test_failed({ error: result.error ?? "" }), {
          icon: <XCircle className="size-4" />,
        });
      }
    } catch {
      toast.error(m.admin_otel_test_failed({ error: "Connection error" }));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* Status Summary */}
      <StatusSummary config={initialData.config} />

      {/* Enable toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {m.admin_otel_enable()}
              </CardTitle>
              <CardDescription>
                {m.admin_otel_enable_description()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <SourceBadge source={sources.enabled} />
              <form.Field name="enabled">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Endpoint & Service Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{m.admin_otel_title()}</CardTitle>
          <CardDescription>{m.admin_otel_description()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endpoint */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{m.admin_otel_endpoint()}</Label>
              <SourceBadge source={sources.endpoint} />
              <RestartBadge />
            </div>
            <div className="flex gap-2">
              <form.Field name="endpoint">
                {(field) => (
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={m.admin_otel_endpoint_placeholder()}
                    className="flex-1"
                  />
                )}
              </form.Field>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isTesting}
                onClick={() => void handleTestConnection()}
              >
                {isTesting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {m.admin_otel_test_connection()}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {m.admin_otel_endpoint_description()}
            </p>
          </div>

          {/* Service Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{m.admin_otel_service_name()}</Label>
              <SourceBadge source={sources.serviceName} />
              <RestartBadge />
            </div>
            <form.Field name="serviceName">
              {(field) => (
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={m.admin_otel_service_name_placeholder()}
                />
              )}
            </form.Field>
            <p className="text-sm text-muted-foreground">
              {m.admin_otel_service_name_description()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {m.admin_otel_auth_title()}
          </CardTitle>
          <CardDescription>
            {m.admin_otel_auth_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth Type Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{m.admin_otel_auth_type()}</Label>
              <SourceBadge source={sources.authType} />
              <RestartBadge />
            </div>
            <form.Field name="authType">
              {(field) => (
                <Select
                  value={field.state.value}
                  onValueChange={(v) =>
                    field.handleChange(v as OtelAuthType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {m.admin_otel_auth_none()}
                    </SelectItem>
                    <SelectItem value="custom_headers">
                      {m.admin_otel_auth_custom_headers()}
                    </SelectItem>
                    <SelectItem value="bearer">
                      {m.admin_otel_auth_bearer()}
                    </SelectItem>
                    <SelectItem value="basic">
                      {m.admin_otel_auth_basic()}
                    </SelectItem>
                    <SelectItem value="api_key">
                      {m.admin_otel_auth_api_key()}
                    </SelectItem>
                    <SelectItem value="mtls">
                      {m.admin_otel_auth_mtls()}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </form.Field>
          </div>

          {/* Conditional Auth Fields */}
          <form.Subscribe selector={(state) => state.values.authType}>
            {(authType) => (
              <>
                {/* Custom Headers */}
                {authType === "custom_headers" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>{m.admin_otel_headers()}</Label>
                      <SourceBadge source={sources.customHeaders} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {m.admin_otel_headers_description()}
                    </p>
                    <div className="space-y-2">
                      {customHeaders.map((header, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={header.key}
                            onChange={(e) => {
                              const updated = [...customHeaders];
                              updated[index] = {
                                ...updated[index],
                                key: e.target.value,
                              };
                              setCustomHeaders(updated);
                            }}
                            placeholder={m.admin_otel_headers_key_placeholder()}
                            className="flex-1"
                          />
                          <Input
                            value={header.value}
                            onChange={(e) => {
                              const updated = [...customHeaders];
                              updated[index] = {
                                ...updated[index],
                                value: e.target.value,
                              };
                              setCustomHeaders(updated);
                            }}
                            placeholder={m.admin_otel_headers_value_placeholder()}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setCustomHeaders(
                                customHeaders.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCustomHeaders([
                            ...customHeaders,
                            { key: "", value: "" },
                          ])
                        }
                      >
                        <Plus className="size-4" />
                        {m.common_add()}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bearer Token */}
                {authType === "bearer" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>{m.admin_otel_auth_bearer_token()}</Label>
                      <SourceBadge source={sources.bearerToken} />
                      <RestartBadge />
                    </div>
                    <form.Field name="bearerToken">
                      {(field) => (
                        <Input
                          type="password"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={m.admin_otel_auth_bearer_token_placeholder()}
                        />
                      )}
                    </form.Field>
                  </div>
                )}

                {/* Basic Auth */}
                {authType === "basic" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>{m.admin_otel_auth_basic_user()}</Label>
                        <SourceBadge source={sources.basicUser} />
                        <RestartBadge />
                      </div>
                      <form.Field name="basicUser">
                        {(field) => (
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder={m.admin_otel_auth_basic_user_placeholder()}
                          />
                        )}
                      </form.Field>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>{m.admin_otel_auth_basic_pass()}</Label>
                        <SourceBadge source={sources.basicPass} />
                        <RestartBadge />
                      </div>
                      <form.Field name="basicPass">
                        {(field) => (
                          <Input
                            type="password"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder={m.admin_otel_auth_basic_pass_placeholder()}
                          />
                        )}
                      </form.Field>
                    </div>
                  </div>
                )}

                {/* API Key */}
                {authType === "api_key" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>{m.admin_otel_auth_api_key_header()}</Label>
                        <SourceBadge source={sources.apiKeyHeader} />
                        <RestartBadge />
                      </div>
                      <form.Field name="apiKeyHeader">
                        {(field) => (
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="x-api-key"
                          />
                        )}
                      </form.Field>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>{m.admin_otel_auth_api_key_value()}</Label>
                        <SourceBadge source={sources.apiKeyValue} />
                        <RestartBadge />
                      </div>
                      <form.Field name="apiKeyValue">
                        {(field) => (
                          <Input
                            type="password"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder={m.admin_otel_auth_api_key_value_placeholder()}
                          />
                        )}
                      </form.Field>
                    </div>
                  </div>
                )}

                {/* mTLS note */}
                {authType === "mtls" && (
                  <p className="text-sm text-muted-foreground">
                    {m.admin_otel_auth_mtls_description()}
                  </p>
                )}
              </>
            )}
          </form.Subscribe>
        </CardContent>
      </Card>

      {/* TLS Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {m.admin_otel_tls_title()}
          </CardTitle>
          <CardDescription>
            {m.admin_otel_tls_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{m.admin_otel_tls_ca_cert()}</Label>
              <SourceBadge source={sources.tlsCaCertPath} />
              <RestartBadge />
            </div>
            <form.Field name="tlsCaCertPath">
              {(field) => (
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={m.admin_otel_tls_path_placeholder()}
                />
              )}
            </form.Field>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{m.admin_otel_tls_client_cert()}</Label>
              <SourceBadge source={sources.tlsClientCertPath} />
              <RestartBadge />
            </div>
            <form.Field name="tlsClientCertPath">
              {(field) => (
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={m.admin_otel_tls_path_placeholder()}
                />
              )}
            </form.Field>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{m.admin_otel_tls_client_key()}</Label>
              <SourceBadge source={sources.tlsClientKeyPath} />
              <RestartBadge />
            </div>
            <form.Field name="tlsClientKeyPath">
              {(field) => (
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={m.admin_otel_tls_path_placeholder()}
                />
              )}
            </form.Field>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label>{m.admin_otel_tls_skip_verify()}</Label>
                <SourceBadge source={sources.tlsInsecureSkipVerify} />
                <RestartBadge />
              </div>
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <AlertTriangle className="size-3" />
                {m.admin_otel_tls_skip_verify_warning()}
              </div>
            </div>
            <form.Field name="tlsInsecureSkipVerify">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {m.admin_otel_logs_title()}
              </CardTitle>
              <CardDescription>
                {m.admin_otel_logs_description()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <SourceBadge source={sources.logsEnabled} />
              <RestartBadge />
              <form.Field name="logsEnabled">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Runtime config (no restart needed) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {m.admin_otel_runtime_title()}
          </CardTitle>
          <CardDescription>
            {m.admin_otel_runtime_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{m.admin_otel_sample_rate()}</Label>
              <SourceBadge source={sources.sampleRate} />
            </div>
            <form.Field name="sampleRate">
              {(field) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(parseFloat(e.target.value) || 0)
                  }
                />
              )}
            </form.Field>
            <p className="text-sm text-muted-foreground">
              {m.admin_otel_sample_rate_description()}
            </p>
          </div>

          {/* Export Interval */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{m.admin_otel_export_interval()}</Label>
              <SourceBadge source={sources.exportInterval} />
            </div>
            <form.Field name="exportInterval">
              {(field) => (
                <Input
                  type="number"
                  min={5000}
                  step={1000}
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(parseInt(e.target.value, 10) || 60000)
                  }
                />
              )}
            </form.Field>
            <p className="text-sm text-muted-foreground">
              {m.admin_otel_export_interval_description()}
            </p>
          </div>

          {/* Console Exporter */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label>{m.admin_otel_console_exporter()}</Label>
                <SourceBadge source={sources.consoleExporter} />
                <RestartBadge />
              </div>
              <p className="text-sm text-muted-foreground">
                {m.admin_otel_console_exporter_description()}
              </p>
            </div>
            <form.Field name="consoleExporter">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? m.common_saving() : m.common_save()}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
