import { getLocalPanditImage } from "../../src/features/pandits/panditImages";

// SVG imports are not transformed under jest-expo, so stub each bundled asset with a component.
// jest.mock calls are hoisted above the import above by the transform.
jest.mock("../../assets/pandits/pandit-ramesh.svg", () => "PanditRamesh", { virtual: true });
jest.mock("../../assets/pandits/pandit-krishna.svg", () => "PanditKrishna", { virtual: true });
jest.mock("../../assets/pandits/pandit-anil.svg", () => "PanditAnil", { virtual: true });
jest.mock("../../assets/pandits/pandit-mahesh.svg", () => "PanditMahesh", { virtual: true });
jest.mock("../../assets/pandits/pandit-suresh.svg", () => "PanditSuresh", { virtual: true });
jest.mock("../../assets/pandits/pandit-vishnu.svg", () => "PanditVishnu", { virtual: true });
jest.mock("../../assets/pandits/pandit-gopal.svg", () => "PanditGopal", { virtual: true });
jest.mock("../../assets/pandits/pandit-venkatesh.svg", () => "PanditVenkatesh", { virtual: true });

describe("Pandit image resolver", () => {
  it("resolves seeded pandit image references to bundled artwork", () => {
    expect(getLocalPanditImage("pandits/pandit-ramesh.png")).toBeTruthy();
    expect(getLocalPanditImage("pandits/pandit-venkatesh.png")).toBeTruthy();
  });

  it("returns undefined for unknown or missing references", () => {
    expect(getLocalPanditImage("pandits/unknown.png")).toBeUndefined();
    expect(getLocalPanditImage(null)).toBeUndefined();
    expect(getLocalPanditImage(undefined)).toBeUndefined();
  });
});
