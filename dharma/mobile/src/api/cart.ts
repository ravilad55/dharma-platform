import api from "./client";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  available: boolean;
};

export type Cart = {
  id: string;
  shopId?: string | null;
  shopName?: string | null;
  currency: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  serviceCharge: number;
  total: number;
  itemCount: number;
};

export async function getCart(): Promise<Cart> {
  return (await api.get<Cart>("/cart")).data;
}

export async function addCartItem(productId: string, quantity = 1): Promise<Cart> {
  return (await api.post<Cart>("/cart/items", { productId, quantity })).data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return (await api.put<Cart>(`/cart/items/${itemId}`, { quantity })).data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  return (await api.delete<Cart>(`/cart/items/${itemId}`)).data;
}

export async function clearCart(): Promise<Cart> {
  return (await api.delete<Cart>("/cart")).data;
}
