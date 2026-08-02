import { screen } from "@testing-library/react";
import { reconciliationApi } from "../../api/reconciliation-api";
import { renderWithProviders } from "../../test/render";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders health, daily metrics, and recent report evidence", async () => {
    vi.spyOn(reconciliationApi, "health").mockResolvedValue({ status: "UP" });
    vi.spyOn(reconciliationApi, "metrics").mockResolvedValue({
      businessDate: "2026-07-18",
      consumedEventCount: 100,
      uniqueEventCount: 99,
      databaseRecordCount: 99,
      aggregateRecordCount: 98,
      databaseAmount: 990,
      aggregateAmount: 980,
      updatedAt: "2026-07-19T08:00:00Z",
    });
    vi.spyOn(reconciliationApi, "reports").mockResolvedValue([]);
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText("Backend UP")).toBeInTheDocument();
    expect(await screen.findByText("Kafka observations")).toBeInTheDocument();
    expect(screen.getByText("Database records")).toBeInTheDocument();
    expect(screen.getByText(/No reports exist/)).toBeInTheDocument();
  });
});
