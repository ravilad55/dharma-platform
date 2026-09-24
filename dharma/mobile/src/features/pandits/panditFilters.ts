// Pandit discovery helpers kept outside the Expo Router screen so Jest can import them without
// loading route-level modules (same approach as the orders feature).

export interface PanditsPageShape {
  page: number;
  pageSize: number;
  totalCount: number;
}

/** Derives the next page, or undefined when the server reports no more pandits. */
export function getNextPanditsPageParam(lastPage: PanditsPageShape): number | undefined {
  const loaded = lastPage.page * lastPage.pageSize;
  return loaded < lastPage.totalCount ? lastPage.page + 1 : undefined;
}

export type PanditFilterId = "all" | "puja" | "havan" | "griha-pravesh" | "wedding" | "other";

export interface PanditFilter {
  id: PanditFilterId;
  label: string;
  /** Value sent as the `service` query parameter, or undefined for "All". */
  serviceParam?: string;
}

/**
 * Home-screen filter chips. Each chip maps to the API `service` query parameter (server-side match
 * against active service names). "All" clears the filter; "Other" has no direct service mapping and
 * is treated as a no-op filter for V1 so results are never hard-coded on the client.
 */
export const panditFilters: PanditFilter[] = [
  { id: "all", label: "All" },
  { id: "puja", label: "Puja", serviceParam: "Puja" },
  { id: "havan", label: "Havan", serviceParam: "Havan" },
  { id: "griha-pravesh", label: "Griha Pravesh", serviceParam: "Griha Pravesh" },
  { id: "wedding", label: "Wedding", serviceParam: "Wedding" },
  { id: "other", label: "Other" },
];

/** Resolves the `service` query parameter for a selected filter id. */
export function serviceParamForFilter(filterId: PanditFilterId): string | undefined {
  return panditFilters.find((filter) => filter.id === filterId)?.serviceParam;
}
