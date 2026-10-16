import { useServiceSelectionStore } from "../../src/features/pandits/serviceSelectionStore";
import { formatDurationLabel } from "../../src/features/pandits/serviceFormat";

const sample = {
  panditId: "p1",
  panditName: "Pandit Ramesh Sharma",
  serviceId: "s1",
  serviceName: "Satyanarayan Puja",
  price: 999,
  currency: "INR",
  durationMinutes: 120,
};

describe("service selection store", () => {
  beforeEach(() => {
    useServiceSelectionStore.getState().clearSelection();
  });

  it("starts with no selection", () => {
    expect(useServiceSelectionStore.getState().selected).toBeNull();
  });

  it("retains a selected service", () => {
    useServiceSelectionStore.getState().selectService(sample);
    expect(useServiceSelectionStore.getState().selected).toEqual(sample);
  });

  it("keeps only one service selected at a time (selecting replaces)", () => {
    useServiceSelectionStore.getState().selectService(sample);
    const other = { ...sample, serviceId: "s2", serviceName: "Griha Pravesh", price: 2100, durationMinutes: 180 };
    useServiceSelectionStore.getState().selectService(other);
    const current = useServiceSelectionStore.getState().selected;
    expect(current?.serviceId).toBe("s2");
    expect(current?.serviceName).toBe("Griha Pravesh");
  });

  it("clears the selection", () => {
    useServiceSelectionStore.getState().selectService(sample);
    useServiceSelectionStore.getState().clearSelection();
    expect(useServiceSelectionStore.getState().selected).toBeNull();
  });
});

describe("service duration formatting", () => {
  it("formats hours and minutes", () => {
    expect(formatDurationLabel(120)).toBe("2 hrs");
    expect(formatDurationLabel(60)).toBe("1 hr");
    expect(formatDurationLabel(90)).toBe("1 hr 30 min");
    expect(formatDurationLabel(45)).toBe("45 min");
    expect(formatDurationLabel(0)).toBe("0 min");
  });
});
