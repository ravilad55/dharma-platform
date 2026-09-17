import api from "./client";

export type ProductCategory = { id: string; name: string; description?: string; sortOrder: number };
export type Product = { id: string; name: string; shortDescription?: string; price: number; currency: string; imageUrl?: string; category: ProductCategory; isAvailable: boolean; shopName: string };
export type PagedProducts = { items: Product[]; page: number; pageSize: number; totalCount: number };

export async function getCategories(): Promise<ProductCategory[]> {
  return (await api.get<ProductCategory[]>("/product-categories")).data;
}

export async function getProducts(params: { categoryId?: string; search?: string }): Promise<PagedProducts> {
  return (await api.get<PagedProducts>("/products", { params: { ...params, page: 1, pageSize: 20 } })).data;
}