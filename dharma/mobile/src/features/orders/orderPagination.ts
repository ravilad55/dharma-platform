// Pagination helper for the customer orders infinite query. Kept outside the Expo Router
// screen so Jest can import it without loading route-level modules.
export interface OrdersPageShape {
  page: number;
  pageSize: number;
  totalCount: number;
}

/** Derives the next page, or undefined when the server reports no more orders. */
export function getNextOrdersPageParam(lastPage: OrdersPageShape): number | undefined {
  const loaded = lastPage.page * lastPage.pageSize;
  return loaded < lastPage.totalCount ? lastPage.page + 1 : undefined;
}