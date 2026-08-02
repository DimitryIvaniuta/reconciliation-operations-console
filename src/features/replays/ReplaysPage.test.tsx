import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { reconciliationApi } from "../../api/reconciliation-api";
import { renderWithProviders } from "../../test/render";
import { ReplaysPage } from "./ReplaysPage";

const job = {
  jobId: "22222222-2222-4222-8222-222222222222",
  idempotencyKey: "idempotency-1",
  fromDate: "2026-07-18",
  toDate: "2026-07-18",
  dryRun: true,
  status: "REQUESTED" as const,
  discoveredEvents: 0,
  replayedEvents: 0,
  attemptCount: 0,
  requestedBy: "operations-console",
  correlationId: "corr-2",
  errorMessage: null,
  requestedAt: "2026-07-19T08:00:00Z",
  startedAt: null,
  completedAt: null,
  commandPublishedAt: null,
  heartbeatAt: null,
};

describe("ReplaysPage", () => {
  it("submits a dry-run replay with idempotency and operator identity", async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(reconciliationApi, "requestReplay").mockResolvedValue(job);
    renderWithProviders(
      <Routes>
        <Route path="/replays" element={<ReplaysPage />} />
        <Route path="/replays/:jobId" element={<p>Replay detail route</p>} />
      </Routes>,
      ["/replays"],
    );
    await user.click(screen.getByRole("button", { name: "Request replay" }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0]?.[1]).toMatchObject({
      dryRun: true,
      requestedBy: "operations-console",
    });
    expect(await screen.findByText("Replay detail route")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("ledgerguard.recentReplayIds") ?? "[]")).toContain(
      job.jobId,
    );
  });

  it("requires explicit confirmation before a projection-repair replay", async () => {
    const user = userEvent.setup();
    const request = vi
      .spyOn(reconciliationApi, "requestReplay")
      .mockResolvedValue({ ...job, dryRun: false });
    renderWithProviders(
      <Routes>
        <Route path="/replays" element={<ReplaysPage />} />
        <Route path="/replays/:jobId" element={<p>Replay detail route</p>} />
      </Routes>,
      ["/replays"],
    );

    await user.click(screen.getByRole("checkbox", { name: /Dry-run only/ }));
    await user.click(screen.getByRole("button", { name: "Request replay" }));
    expect(request).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Confirm projection repair" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start repair replay" }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0]?.[1]).toMatchObject({ dryRun: false });
  });
});
