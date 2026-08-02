import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { reconciliationApi } from "../../api/reconciliation-api";
import { renderWithProviders } from "../../test/render";
import { ReconciliationRunPage } from "./ReconciliationRunPage";

const report = {
  reportId: "11111111-1111-4111-8111-111111111111",
  businessDate: "2026-07-18",
  triggerType: "MANUAL" as const,
  status: "MISMATCH" as const,
  kafkaEventCount: 10,
  consumedEventCount: 9,
  uniqueEventCount: 9,
  databaseRecordCount: 9,
  aggregateRecordCount: 9,
  databaseAmount: 90,
  aggregateAmount: 90,
  sourceOffsets: [],
  issues: [
    {
      type: "KAFKA_VS_SOURCE_OBSERVATIONS" as const,
      expected: "10",
      actual: "9",
      delta: "-1",
      action: "Replay missing source position",
    },
  ],
  correlationId: "corr-1",
  createdAt: "2026-07-19T08:00:00Z",
};

describe("ReconciliationRunPage", () => {
  it("creates and links an immutable report", async () => {
    const user = userEvent.setup();
    vi.spyOn(reconciliationApi, "runReconciliation").mockResolvedValue(report);
    renderWithProviders(<ReconciliationRunPage />);
    await user.click(screen.getByRole("button", { name: "Run reconciliation" }));
    await waitFor(() => expect(screen.getByText("Report created")).toBeInTheDocument());
    expect(screen.getByText("MISMATCH")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open report" })).toHaveAttribute(
      "href",
      `/reports/${report.reportId}`,
    );
  });
});
