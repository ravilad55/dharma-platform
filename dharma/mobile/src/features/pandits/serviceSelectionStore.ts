import { create } from "zustand";

/**
 * Transient Pandit booking selection (BOOKING-02 service selection + BOOKING-03 date/time). The
 * customer's choices must survive navigating Profile → Service → Date → Times → Select Time. Only
 * lightweight selection data is stored here — the authoritative catalog/availability always lives in
 * TanStack Query. No booking is created in these slices.
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

export interface SelectedSlot {
  slotId: string;
  startAt: string;
  endAt: string;
}

type ServiceSelectionState = {
  selected: SelectedService | null;
  /** Local calendar date (yyyy-MM-dd) chosen for availability. */
  selectedDate: string | null;
  /** Chosen time slot, retained when continuing. */
  selectedSlot: SelectedSlot | null;
  selectService: (selection: SelectedService) => void;
  selectDate: (date: string) => void;
  selectSlot: (slot: SelectedSlot) => void;
  clearSelection: () => void;
};

export const useServiceSelectionStore = create<ServiceSelectionState>((set, get) => ({
  selected: null,
  selectedDate: null,
  selectedSlot: null,
  selectService: (selection) => {
    const current = get().selected;
    // Changing service (or pandit) invalidates any previously chosen date/slot.
    const sameService = current?.panditId === selection.panditId && current?.serviceId === selection.serviceId;
    set({
      selected: selection,
      selectedDate: sameService ? get().selectedDate : null,
      selectedSlot: sameService ? get().selectedSlot : null,
    });
  },
  // Changing the date invalidates a previously chosen slot (slots are per-date).
  selectDate: (date) => set((state) => ({ selectedDate: date, selectedSlot: state.selectedDate === date ? state.selectedSlot : null })),
  selectSlot: (slot) => set({ selectedSlot: slot }),
  clearSelection: () => set({ selected: null, selectedDate: null, selectedSlot: null }),
}));
