import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPost = jest.fn();

jest.mock("../../utils/api", () => ({
  post: (...args) => mockPost(...args)
}));

import CalculateDistanceSystem from "./index.jsx";

describe("CalculateDistanceSystem", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("envía solicitud y muestra resultado", async () => {
    mockPost.mockResolvedValue({
      data: {
        distanceKm: 12.5,
        durationMinutes: 25,
        providerMeta: {
          originAddress: "Origen fake",
          destinationAddress: "Destino fake",
          distanceText: "12.5 km",
          durationText: "25 mins",
          cacheHit: false,
          mode: "driving"
        }
      }
    });

    render(<CalculateDistanceSystem />);

    await userEvent.type(screen.getByPlaceholderText(/Origen/i), "4.65,-74.05");
    await userEvent.type(screen.getByPlaceholderText(/Destino/i), "4.86,-74.03");
    await userEvent.click(screen.getByRole("button", { name: /Calcular/i }));

    expect(mockPost).toHaveBeenCalledWith("/maps/calculate", {
      origin: { lat: 4.65, lng: -74.05 },
      destination: { lat: 4.86, lng: -74.03 },
      mode: "driving"
    });

  const distanceLabel = await screen.findByText("Distancia:");
  const distanceRow = distanceLabel.closest("p");
  expect(distanceRow).toHaveTextContent(/Distancia:\s*12\.5\s*km/);
  const destinationLabel = screen.getByText("Destino:");
  const destinationRow = destinationLabel.closest("p");
  expect(destinationRow).toHaveTextContent(/Destino:\s*Destino fake/);
  });

  it("muestra mensaje de error cuando la API falla", async () => {
    mockPost.mockRejectedValue({ response: { data: { error: "Rate limit" } } });

    render(<CalculateDistanceSystem />);

    await userEvent.type(screen.getByPlaceholderText(/Origen/i), "Campus");
    await userEvent.type(screen.getByPlaceholderText(/Destino/i), "Bogotá");
    await userEvent.selectOptions(screen.getByRole("combobox"), "transit");
    await userEvent.click(screen.getByRole("button", { name: /Calcular/i }));

    expect(mockPost).toHaveBeenCalledWith("/maps/calculate", {
      origin: "Campus",
      destination: "Bogotá",
      mode: "transit"
    });

    expect(await screen.findByText("Rate limit")).toBeInTheDocument();
  });
});
