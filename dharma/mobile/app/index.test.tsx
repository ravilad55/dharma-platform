import { render } from "@testing-library/react-native";

import HomeScreen from "./index";

describe("initial application shell", () => {
  it("renders the Dharma entry point", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText("Dharma")).toBeTruthy();
  });
});