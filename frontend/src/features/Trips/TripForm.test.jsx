import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripForm from "./TripForm.jsx";


const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("../../utils/api", () => ({
  get: (...args) => mockGet(...args),
  post: (...args) => mockPost(...args)
}));

jest.mock("../../components/TransmilenioMap.jsx", () => ({
  __esModule: true,
  default: () => <div data-testid="transmilenio-map" />
}));

jest.mock("../../context/AuthContext.jsx", () => ({
  useAuth: () => ({
    user: { roles: ["driver"], activeVehicle: "veh1" }
  })
}));

const futureIso = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const iso = date.toISOString();
  return iso.slice(0, 16);
};

const vehicleFixture = () => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    _id: "veh1",
    brand: "Kia",
    model: "Rio",
    plate: "ABC123",
    capacity: 4,
    soatExpiration: future,
    licenseExpiration: future,
    pickupPoints: []
  };
};


const stopsFixture = [
  { id: "stop1", name: "Portal Norte", lat: 4.703, lng: -74.046 },
  { id: "stop2", name: "Calle 100", lat: 4.679, lng: -74.043 }
];

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockGet.mockImplementation((url) => {
    if (url === "/vehicles/overview") {
      return Promise.resolve({ data: { vehicles: [vehicleFixture()], activeVehicle: "veh1" } });
    }
    if (url === "/maps/transmilenio/stops") {
      return Promise.resolve({ data: { stops: stopsFixture } });
    }
    return Promise.resolve({ data: {} });
  });
});


async function fillRequiredFields() {
  // Select origin stop
  const originSelect = screen.getByLabelText(/Origen.*parada oficial/i);
  await userEvent.selectOptions(originSelect, "stop1");
  // Select destination stop
  const destSelect = screen.getByLabelText(/Destino.*parada oficial/i);
  await userEvent.selectOptions(destSelect, "stop2");
  // Fill other fields
  const departure = screen.getByLabelText(/Fecha y hora de salida/);
  const seats = screen.getByLabelText(/Puestos totales/);
  await userEvent.clear(departure);
  await userEvent.type(departure, futureIso());
  await userEvent.clear(seats);
  await userEvent.type(seats, "3");

  // Simulate drawing a polyline (required for new trip form)
  // Find the TripForm component instance and set routePolyline
  // (We rely on the TransmilenioMap mock, so we can set the state directly)
  const formSection = screen.getByTestId("trip-form").parentElement;
  // Find the React component instance (TripForm) and set routePolyline
  // This is a workaround for test environment; in real E2E, you'd interact with the map
  // Here, we use a hack: find the React state setter via the window object or by rerendering
  // Instead, we can fire a custom event if TripForm listens for it, or patch the state via act()
  // For now, we patch the prototype for test only
  // eslint-disable-next-line no-undef
  const reactFiberKey = Object.keys(formSection).find((k) => k.startsWith("__reactFiber$"));
  if (reactFiberKey) {
    let fiber = formSection[reactFiberKey];
    while (fiber) {
      if (fiber.stateNode && fiber.stateNode.setRoutePolyline) {
        fiber.stateNode.setRoutePolyline([
          { lat: 4.7, lng: -74.05 },
          { lat: 4.71, lng: -74.06 }
        ]);
        break;
      }
      fiber = fiber.return;
    }
  }
}

describe("TripForm - tariff suggestion", () => {
  it("fetches tariff suggestion and applies it", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        suggestedTariff: 12200,
        range: { min: 9800, max: 14600 },
        breakdown: {
          baseBoarding: 1500,
          distanceComponent: 5625,
          durationComponent: 3000,
          demandFactor: 1.2,
          minimumFare: 3000
        }
      }
    });

    render(<TripForm testRoutePolyline={[{ lat: 4.7, lng: -74.05 }, { lat: 4.71, lng: -74.06 }]} />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith("/vehicles/overview"));

    const distanceInput = screen.getByLabelText(/Distancia estimada/);
    const durationInput = screen.getByLabelText(/Duración estimada/);
    const priceInput = screen.getByLabelText(/Precio por puesto/);

    await userEvent.type(distanceInput, "12.5");
    await userEvent.type(durationInput, "25");
    await userEvent.click(screen.getByRole("button", { name: /Obtener tarifa sugerida/i }));

    expect(mockPost).toHaveBeenCalledWith("/trips/tariff/suggest", {
      distanceKm: 12.5,
      durationMinutes: 25
    });

    expect(await screen.findByText(/Tarifa sugerida:/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Aplicar tarifa sugerida/i }));
    expect(priceInput).toHaveValue(12200);
  });

  it("prevents submission when price is outside suggested range", async () => {
    mockPost.mockImplementation((url) => {
      if (url === "/trips/tariff/suggest") {
        return Promise.resolve({
          data: {
            suggestedTariff: 12200,
            range: { min: 9800, max: 14600 },
            breakdown: {
              baseBoarding: 1500,
              distanceComponent: 5625,
              durationComponent: 3000,
              demandFactor: 1,
              minimumFare: 3000
            }
          }
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(<TripForm />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith("/vehicles/overview"));

    await fillRequiredFields();

    const distanceInput = screen.getByLabelText(/Distancia estimada/);
    const durationInput = screen.getByLabelText(/Duración estimada/);
    const priceInput = screen.getByLabelText(/Precio por puesto/);

    await userEvent.type(distanceInput, "12.5");
    await userEvent.type(durationInput, "25");
    await userEvent.type(priceInput, "15000");
    await userEvent.click(screen.getByRole("button", { name: /Obtener tarifa sugerida/i }));

    // Wait for tariff suggestion to be present
    await waitFor(() => {
      expect(screen.getByText(/Tarifa sugerida:/)).toBeInTheDocument();
    });



    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "5000");

    await userEvent.click(screen.getByRole("button", { name: /Publicar viaje/i }));

    // Assert error message is shown using data-testid for robustness
    await waitFor(() => {
      expect(screen.getByTestId("trip-form-error").textContent).toContain("El precio debe estar entre");
    });
  });
});
