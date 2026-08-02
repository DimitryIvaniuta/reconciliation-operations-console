import { requestJson } from "./http-client";

const response = (body: unknown, init: ResponseInit = {}) => {
  const { headers: providedHeaders, ...responseInit } = init;
  const headers = new Headers(providedHeaders);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { status: 200, ...responseInit, headers });
};

describe("requestJson", () => {
  it("adds security and correlation headers without logging credentials", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response({ ok: true }));
    await expect(
      requestJson<{ ok: boolean }>("/api/test", {
        method: "POST",
        apiKey: "secret",
        body: { a: 1 },
      }),
    ).resolves.toEqual({ ok: true });
    const [, options] = fetchMock.mock.calls[0] ?? [];
    const headers = new Headers(options?.headers);
    expect(headers.get("X-API-Key")).toBe("secret");
    expect(headers.get("X-Correlation-ID")).toMatch(/[0-9a-f-]{36}/);
    expect(options?.credentials).toBe("same-origin");
    expect(options?.redirect).toBe("error");
  });

  it("maps RFC problem details and response correlation IDs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      response(
        { title: "Invalid request", detail: "Date range is invalid", status: 400 },
        {
          status: 400,
          headers: { "content-type": "application/problem+json", "X-Correlation-ID": "corr-1" },
        },
      ),
    );
    await expect(requestJson("/api/test")).rejects.toMatchObject({
      status: 400,
      message: "Date range is invalid",
      correlationId: "corr-1",
    });
  });

  it("returns a safe network error without exposing low-level exception text", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("socket secret detail"));
    await expect(requestJson("/api/test")).rejects.toMatchObject({
      status: 0,
      message: "The service could not be reached.",
    });
  });

  it("preserves caller cancellation for TanStack Query", async () => {
    const controller = new AbortController();
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Cancelled", "AbortError")),
            { once: true },
          );
        }),
    );

    const pending = requestJson("/api/test", { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("captures bounded Retry-After guidance", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      response(
        { title: "Busy", detail: "Try again later", status: 503 },
        {
          status: 503,
          headers: { "content-type": "application/problem+json", "Retry-After": "12" },
        },
      ),
    );
    await expect(requestJson("/api/test")).rejects.toMatchObject({
      status: 503,
      retryAfterSeconds: 12,
    });
  });

  it("rejects an oversized success response before parsing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      response({ ok: true }, { headers: { "content-length": "2097153" } }),
    );
    await expect(requestJson("/api/test")).rejects.toMatchObject({
      status: 502,
      message: "The backend response exceeded the accepted size limit.",
    });
  });

  it("stops reading an oversized chunked success response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(`{"data":"${"x".repeat(2 * 1024 * 1024)}"}`, {
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(requestJson("/api/test")).rejects.toMatchObject({
      status: 502,
      message: "The backend response exceeded the accepted size limit.",
    });
  });
});

describe("request boundary hardening", () => {
  it("blocks cross-origin targets before a credential can be transmitted", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      requestJson("https://attacker.example/api", { apiKey: "secret" }),
    ).rejects.toMatchObject({
      status: 0,
      message: "Service requests must remain on the application origin.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emits the unauthorized session event for HTTP 401", async () => {
    const listener = vi.fn();
    window.addEventListener("ledgerguard:unauthorized", listener);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      response(
        { title: "Unauthorized", detail: "Missing or invalid API key", status: 401 },
        { status: 401, headers: { "content-type": "application/problem+json" } },
      ),
    );
    await expect(requestJson("/api/test")).rejects.toMatchObject({ status: 401 });
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("ledgerguard:unauthorized", listener);
  });
});
