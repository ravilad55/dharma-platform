import api from "../../src/api/client";
import { createAddress, getAddresses } from "../../src/api/addresses";

jest.mock("../../src/api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = api.get as jest.Mock;
const mockedPost = api.post as jest.Mock;

const addressPayload = {
  id: "addr-1",
  label: "Home",
  contactName: "Ravi Sharma",
  contactPhone: "+919876543210",
  addressLine1: "Flat 101",
  addressLine2: null,
  city: "Thane",
  state: "Maharashtra",
  postalCode: "400601",
  country: "IN",
  latitude: 19.2183,
  longitude: 72.9781,
  isDefault: true,
  createdAtUtc: "2026-09-15T10:30:00Z",
  updatedAtUtc: "2026-09-15T10:30:00Z",
};

describe("Addresses API client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists the authenticated customer's addresses", async () => {
    mockedGet.mockResolvedValueOnce({ data: [addressPayload] });

    await expect(getAddresses()).resolves.toEqual([addressPayload]);
    expect(mockedGet).toHaveBeenCalledWith("/addresses");
  });

  it("creates an address through the existing address API", async () => {
    mockedPost.mockResolvedValueOnce({ data: addressPayload });
    const request = {
      label: "Home",
      contactName: "Ravi Sharma",
      contactPhone: "+919876543210",
      addressLine1: "Flat 101",
      addressLine2: null,
      city: "Thane",
      state: "Maharashtra",
      postalCode: "400601",
      country: "IN",
      latitude: null,
      longitude: null,
      isDefault: true,
    };

    await expect(createAddress(request)).resolves.toEqual(addressPayload);
    expect(mockedPost).toHaveBeenCalledWith("/addresses", request);
  });
});