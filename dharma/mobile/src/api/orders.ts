import api from "./client";

/** Server-owned order status codes exposed by the Dharma API. */
export const orderStatusCodes = {
  pending: 1,
  confirmed: 2,
  processing: 3,
  readyForDelivery: 4,
  outForDelivery: 5,
  delivered: 6,
  cancelled: 7,
} as const;

export type OrderStatus = number;

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  deliveryCharge: number;
  serviceCharge: number;
  total: number;
  currency: string;
  createdAtUtc: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  lineTotal: number;
  currency: string;
}

/** Immutable delivery-address snapshot stored with the order. */
export interface OrderAddress {
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
}

export interface OrderDetails extends OrderSummary {
  updatedAtUtc: string;
  items: OrderItem[];
  address: OrderAddress;
}

export interface PagedOrders {
  items: OrderSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export const ordersPageSize = 20;

export async function getOrders(
  params: { page?: number; pageSize?: number } = {}
): Promise<PagedOrders> {
  const { page = 1, pageSize = ordersPageSize } = params;
  return (await api.get<PagedOrders>("/orders", { params: { page, pageSize } })).data;
}

export async function getOrder(orderId: string): Promise<OrderDetails> {
  return (await api.get<OrderDetails>(`/orders/${orderId}`)).data;
}

export interface CreateOrderRequest {
  addressId: string;
}

/** DTO returned by POST /orders (201). Field names follow the create contract. */
export interface OrderCreated {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  total: number;
  currency: string;
  createdAtUtc: string;
}

export async function createOrder(request: CreateOrderRequest, idempotencyKey: string): Promise<OrderCreated> {
  const response = await api.post<OrderCreated>("/orders", request, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}
