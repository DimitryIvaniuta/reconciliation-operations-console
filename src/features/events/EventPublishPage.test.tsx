import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { reconciliationApi } from "../../api/reconciliation-api";
import { renderWithProviders } from "../../test/render";
import { EventPublishPage } from "./EventPublishPage";

describe("EventPublishPage", () => {
  it("validates and publishes a business event", async () => {
    const user = userEvent.setup();
    const publish = vi
      .spyOn(reconciliationApi, "publishEvent")
      .mockImplementation(async (_context, event) => event);
    renderWithProviders(<EventPublishPage />);
    await user.clear(screen.getByLabelText("Business key"));
    await user.type(screen.getByLabelText("Business key"), "ORDER-TEST-1");
    await user.click(screen.getByRole("button", { name: "Publish event" }));
    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1));
    expect(publish.mock.calls[0]?.[1]).toMatchObject({
      businessKey: "ORDER-TEST-1",
      amount: 125.5,
    });
  });

  it("does not transmit malformed attributes JSON", async () => {
    const user = userEvent.setup();
    const publish = vi.spyOn(reconciliationApi, "publishEvent");
    renderWithProviders(<EventPublishPage />);
    await user.clear(screen.getByLabelText("Attributes JSON"));
    await user.type(screen.getByLabelText("Attributes JSON"), "not-json");
    await user.click(screen.getByRole("button", { name: "Publish event" }));
    expect(await screen.findByText("Attributes must be a valid JSON object")).toBeInTheDocument();
    expect(publish).not.toHaveBeenCalled();
  });
});
