import { useServiceSelectionStore } from "../../src/features/pandits/serviceSelectionStore";
import {
  buildSelectableDates,
  formatDateHeading,
  formatSlotTime,
  toDateValue,
} from "../../src/features/pandits/availabilityDates";

const service = {
  panditId: "p1",
  panditName: "Pandit Ramesh Sharma",
  serviceId: "s1",
  serviceName: "Satyanarayan Puja",
  price: 999,
  currency: "INR",
  durationMinutes: 120,
};

describe("availability date helpers", () => {
  it("builds the requested number of sequential selectable dates starting from the given day", () => {
    const from = new Date(2030, 5, 15); // 15 Jun 2030 (local)
    const dates = buildSelectableDates(3, from);
    expect(dates).toHaveLength(3);
    expect(dates[0].value).toBe("2030-06-15");
    expect(dates[1].value).toBe("2030-06-16");
    expect(dates[2].value).toBe("2030-06-17");
    expect(dates[0].day).toBe("15");
    expect(dates[0].month).toBe("Jun");
  });

  it("formats a date value into a weekday heading", () => {
    expect(formatDateHeading("2030-06-15")).toBe("Sat, 15 Jun");
  });

  it("derives yyyy-MM-dd from a Date", () => {
    expect(toDateValue(new Date(2030, 0, 5))).toBe("2030-01-05");
  });

  it("formats ISO slot times to a 12-hour label using the wall-clock fields", () => {
    expect(formatSlotTime("2030-06-15T09:00:00+05:30")).toBe("9:00 AM");
    expect(formatSlotTime("2030-06-15T14:30:00+05:30")).toBe("2:30 PM");
    expect(formatSlotTime("2030-06-15T00:00:00+05:30")).toBe("12:00 AM");
    expect(formatSlotTime("2030-06-15T12:00:00+05:30")).toBe("12:00 PM");
  });
});

describe("selection store - date & slot retention", () => {
  beforeEach(() => {
    useServiceSelectionStore.getState().clearSelection();
  });

  it("retains the selected date and slot", () => {
    const store = useServiceSelectionStore.getState();
    store.selectService(service);
    store.selectDate("2030-06-15");
    store.selectSlot({ slotId: "slot-1", startAt: "2030-06-15T09:00:00+05:30", endAt: "2030-06-15T11:00:00+05:30" });

    const state = useServiceSelectionStore.getState();
    expect(state.selectedDate).toBe("2030-06-15");
    expect(state.selectedSlot?.slotId).toBe("slot-1");
  });

  it("clears the chosen slot when the date changes", () => {
    const store = useServiceSelectionStore.getState();
    store.selectService(service);
    store.selectDate("2030-06-15");
    store.selectSlot({ slotId: "slot-1", startAt: "a", endAt: "b" });
    useServiceSelectionStore.getState().selectDate("2030-06-16");

    expect(useServiceSelectionStore.getState().selectedSlot).toBeNull();
    expect(useServiceSelectionStore.getState().selectedDate).toBe("2030-06-16");
  });

  it("clears date and slot when a different service is selected", () => {
    const store = useServiceSelectionStore.getState();
    store.selectService(service);
    store.selectDate("2030-06-15");
    store.selectSlot({ slotId: "slot-1", startAt: "a", endAt: "b" });

    useServiceSelectionStore.getState().selectService({ ...service, serviceId: "s2", serviceName: "Griha Pravesh" });
    expect(useServiceSelectionStore.getState().selectedDate).toBeNull();
    expect(useServiceSelectionStore.getState().selectedSlot).toBeNull();
  });

  it("keeps date and slot when the same service is re-selected", () => {
    const store = useServiceSelectionStore.getState();
    store.selectService(service);
    store.selectDate("2030-06-15");
    store.selectSlot({ slotId: "slot-1", startAt: "a", endAt: "b" });

    useServiceSelectionStore.getState().selectService({ ...service });
    expect(useServiceSelectionStore.getState().selectedDate).toBe("2030-06-15");
    expect(useServiceSelectionStore.getState().selectedSlot?.slotId).toBe("slot-1");
  });
});
