import { getApiBaseUrl } from "../../src/api/config";

describe("getApiBaseUrl", () => {
  it("returns override URL or EXPO_PUBLIC_API_URL when provided", () => {
    expect(getApiBaseUrl("https://api.dharma.com/api/v1")).toBe("https://api.dharma.com/api/v1");
  });

  it("defaults to localhost on web/default environment when env var is omitted", () => {
    expect(getApiBaseUrl()).toBe("http://localhost:5000/api/v1");
  });
});
