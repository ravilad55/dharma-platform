import api from "./client";

export interface PanditSummary {
  id: string;
  displayName: string;
  imageUrl?: string | null;
  shortDescription?: string | null;
  experienceYears: number;
  city: string;
  state: string;
  languages: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  primaryServiceName?: string | null;
  startingPrice?: number | null;
  currency: string;
}

export interface PanditService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  currency: string;
}

export interface PanditDetails {
  id: string;
  displayName: string;
  imageUrl?: string | null;
  description?: string | null;
  experienceYears: number;
  city: string;
  state: string;
  languages: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  services: PanditService[];
}

export interface PagedPandits {
  items: PanditSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export const panditsPageSize = 20;

export interface PanditListParams {
  search?: string;
  city?: string;
  service?: string;
  page?: number;
  pageSize?: number;
}

/** Fetches a page of discoverable pandits. Filters map directly to server query parameters. */
export async function getPandits(params: PanditListParams = {}): Promise<PagedPandits> {
  const { search, city, service, page = 1, pageSize = panditsPageSize } = params;
  return (
    await api.get<PagedPandits>("/pandits", {
      params: {
        search: search?.trim() || undefined,
        city: city || undefined,
        service: service || undefined,
        page,
        pageSize,
      },
    })
  ).data;
}

export async function getPandit(panditId: string): Promise<PanditDetails> {
  return (await api.get<PanditDetails>(`/pandits/${panditId}`)).data;
}

export async function getPanditServices(panditId: string): Promise<PanditService[]> {
  return (await api.get<PanditService[]>(`/pandits/${panditId}/services`)).data;
}

export type AvailabilitySlotStatus = "Available" | "Held" | "Booked" | "Blocked";

export interface AvailabilitySlot {
  id: string;
  startAt: string;
  endAt: string;
  status: AvailabilitySlotStatus;
}

export interface Availability {
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
}

/**
 * Fetches a pandit's availability for a service on a local calendar date (yyyy-MM-dd). Slot times are
 * returned in the display timezone reported by the API (Asia/Kolkata for V1).
 */
export async function getAvailability(params: {
  panditId: string;
  serviceId: string;
  date: string;
}): Promise<Availability> {
  const { panditId, serviceId, date } = params;
  return (
    await api.get<Availability>(`/pandits/${panditId}/availability`, {
      params: { date, serviceId },
    })
  ).data;
}
