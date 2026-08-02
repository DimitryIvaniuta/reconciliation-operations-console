import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Braces, Send, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "../../api/http-client";
import { reconciliationApi } from "../../api/reconciliation-api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FieldShell, Input, Textarea } from "../../components/ui/FormField";
import { PageHeader } from "../../components/ui/PageHeader";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";
import { createUuid } from "../../utils/ids";

const schema = z.object({
  eventId: z.uuid("Use a valid UUID"),
  businessKey: z.string().trim().min(1, "Business key is required").max(200),
  eventTime: z.string().min(1, "Event time is required"),
  amount: z.number().min(0, "Amount cannot be negative").finite(),
  attributes: z
    .string()
    .trim()
    .min(2, "Enter a JSON object")
    .refine((value) => {
      try {
        const parsed = JSON.parse(value) as unknown;
        return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
      } catch {
        return false;
      }
    }, "Attributes must be a valid JSON object"),
});

type FormValues = z.infer<typeof schema>;

function defaultValues(): FormValues {
  return {
    eventId: createUuid(),
    businessKey: `ORDER-${Date.now()}`,
    eventTime: new Date().toISOString().slice(0, 16),
    amount: 125.5,
    attributes: JSON.stringify({ channel: "OPERATIONS_CONSOLE", source: "manual" }, null, 2),
  };
}

export function EventPublishPage() {
  useDocumentTitle("Event ingestion");
  const context = useApiContext();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(),
  });
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      reconciliationApi.publishEvent(context, {
        eventId: values.eventId,
        businessKey: values.businessKey.trim(),
        eventTime: new Date(values.eventTime).toISOString(),
        amount: values.amount,
        attributes: JSON.parse(values.attributes) as Record<string, unknown>,
      }),
    onSuccess: (event) => {
      toast.success("Event accepted for Kafka publication", { description: event.eventId });
      form.reset(defaultValues());
    },
    onError: (error) =>
      toast.error("Event publication failed", {
        description: error instanceof ApiError ? error.message : "Unexpected error",
      }),
  });

  return (
    <div className="page page--narrow">
      <PageHeader
        eyebrow="Source operations"
        title="Publish business event"
        description="Submit a validated source event to the Kafka ingestion topic. The broker append timestamp determines its reconciliation day."
      />
      <div className="form-layout">
        <Card title="Event details" subtitle="All values are validated before transmission">
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FieldShell
              label="Event ID"
              htmlFor="eventId"
              error={form.formState.errors.eventId?.message}
              hint="Globally unique idempotency identity"
            >
              <div className="input-action">
                <Input id="eventId" {...form.register("eventId")} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => form.setValue("eventId", createUuid(), { shouldValidate: true })}
                  icon={<Sparkles size={15} />}
                >
                  Generate
                </Button>
              </div>
            </FieldShell>
            <FieldShell
              label="Business key"
              htmlFor="businessKey"
              error={form.formState.errors.businessKey?.message}
            >
              <Input id="businessKey" autoComplete="off" {...form.register("businessKey")} />
            </FieldShell>
            <FieldShell
              label="Domain event time"
              htmlFor="eventTime"
              error={form.formState.errors.eventTime?.message}
              hint="Domain time is preserved but does not determine ingestion day"
            >
              <Input id="eventTime" type="datetime-local" {...form.register("eventTime")} />
            </FieldShell>
            <FieldShell
              label="Amount"
              htmlFor="amount"
              error={form.formState.errors.amount?.message}
            >
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </FieldShell>
            <div className="form-grid__wide">
              <FieldShell
                label="Attributes JSON"
                htmlFor="attributes"
                error={form.formState.errors.attributes?.message}
                hint="Only a JSON object is accepted; scripts are treated as plain data"
              >
                <Textarea
                  id="attributes"
                  rows={9}
                  spellCheck={false}
                  {...form.register("attributes")}
                />
              </FieldShell>
            </div>
            <div className="form-actions form-grid__wide">
              <Button type="submit" loading={mutation.isPending} icon={<Send size={17} />}>
                Publish event
              </Button>
            </div>
          </form>
        </Card>
        <aside className="info-panel">
          <Braces aria-hidden="true" />
          <h2>Idempotent ingestion</h2>
          <p>
            Reusing an event ID with different content is rejected by the backend. Kafka topic,
            partition, offset, and broker timestamp remain the authoritative source lineage.
          </p>
        </aside>
      </div>
    </div>
  );
}
