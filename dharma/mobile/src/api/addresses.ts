import api from "./client";

/** Customer-owned delivery address returned by the Dharma address API. */
export interface CustomerAddress {
  id: string;
  label: string;
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateAddressRequest {
  label: string;
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export async function getAddresses(): Promise<CustomerAddress[]> {
  return (await api.get<CustomerAddress[]>("/addresses")).data;
}

export async function createAddress(request: CreateAddressRequest): Promise<CustomerAddress> {
  return (await api.post<CustomerAddress>("/addresses", request)).data;
}