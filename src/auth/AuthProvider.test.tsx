import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./auth-context";

function Probe() {
  const auth = useAuth();
  return (
    <>
      <span>{auth.authenticated ? "authenticated" : "anonymous"}</span>
      <button type="button" onClick={() => auth.setApiKey("new-secret")}>
        set
      </button>
      <button type="button" onClick={auth.clearApiKey}>
        clear
      </button>
    </>
  );
}

describe("AuthProvider", () => {
  it("keeps the development key in session storage only", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByText("anonymous")).toBeInTheDocument();
    await user.click(screen.getByText("set"));
    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(sessionStorage.getItem("ledgerguard.apiKey")).toBe("new-secret");
    expect(localStorage.getItem("ledgerguard.apiKey")).toBeNull();
    await user.click(screen.getByText("clear"));
    expect(screen.getByText("anonymous")).toBeInTheDocument();
  });
});
