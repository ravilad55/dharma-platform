import { create } from "zustand";

/**
 * Transient checkout selection that must survive navigating from the review
 * screen to address selection and back. Only the selected address ID is stored
 * here; server address data always lives in TanStack Query (["addresses"]).
 */
type OrderReviewState = {
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
};

export const useOrderReviewStore = create<OrderReviewState>((set) => ({
  selectedAddressId: null,
  setSelectedAddressId: (id) => set({ selectedAddressId: id }),
}));