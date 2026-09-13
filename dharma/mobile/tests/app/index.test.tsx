import { render } from "@testing-library/react-native";

import HomeScreen from "../../app/(protected)/home";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

describe("initial application shell", () => {
  it("renders the Dharma entry point", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText("Dharma")).toBeTruthy();
  });
});
