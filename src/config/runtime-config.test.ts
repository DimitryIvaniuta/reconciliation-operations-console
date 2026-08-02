import { readAppConfig } from "./runtime-config";

describe("runtime configuration", () => {
  it("normalizes same-origin service paths", () => {
    window.__APP_CONFIG__ = {
      apiBaseUrl: "/api/",
      healthBaseUrl: "/actuator/",
      authMode: "proxy",
      environment: "test",
    };
    expect(readAppConfig()).toMatchObject({
      apiBaseUrl: "/api",
      healthBaseUrl: "/actuator",
      authMode: "proxy",
    });
  });

  it("rejects a cross-origin API target", () => {
    window.__APP_CONFIG__ = { apiBaseUrl: "https://attacker.example/api" };
    expect(() => readAppConfig()).toThrow(
      "Runtime service URLs must remain on the application origin",
    );
  });

  it("accepts HTTPS support links and blocks script protocols", () => {
    window.__APP_CONFIG__ = {
      apiBaseUrl: "/api",
      healthBaseUrl: "/actuator",
      authMode: "proxy",
      environment: "production",
      supportUrl: "https://support.example.com/ledgerguard",
    };
    expect(readAppConfig().supportUrl).toBe("https://support.example.com/ledgerguard");

    window.__APP_CONFIG__ = {
      ...window.__APP_CONFIG__,
      supportUrl: "javascript:alert(1)",
    };
    expect(() => readAppConfig()).toThrow(
      "Runtime support URL must use HTTPS or remain on the application origin",
    );
  });
});
