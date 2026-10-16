import { create } from "zustand";

/**
 * Transient Pandit service selection (BOOKING-02). The customer selects one service on a Pandit's
 * profile; the choice must survive continuing to the next step. Only lightweight selection data is
 * stored here — the authoritative service catalog always lives in TanStack Query (["pandit", id]).
 * No booking is created in this slice.
 */
export interface SelectedService {
  panditId: string;
  panditName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  currency: string;
  durationMinutes: number;
}

type ServiceSelectionState = {
  selected: SelectedService | null;
  selectService: (selection: SelectedService) => void;
  clearSelection: () => void;
};

export const useServiceSelectionStore = create<ServiceSelectionState>((set) => ({
  selected: null,
  selectService: (selection) => set({ selected: selection }),
  clearSelection: () => set({ selected: null }),
}));
