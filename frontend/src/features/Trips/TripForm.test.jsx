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

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockGet.mockResolvedValue({ data: { vehicles: [vehicleFixture()], activeVehicle: "veh1" } });
});

async function fillRequiredFields() {
  const origin = screen.getByLabelText(/Origen/);
  const destination = screen.getByLabelText(/Destino/);
  const departure = screen.getByLabelText(/Fecha y hora de salida/);
  const seats = screen.getByLabelText(/Puestos totales/);

  await userEvent.clear(origin);
  await userEvent.type(origin, "Campus");
  await userEvent.clear(destination);
  await userEvent.type(destination, "Bogotá");
  await userEvent.clear(departure);
  await userEvent.type(departure, futureIso());
  await userEvent.clear(seats);
  await userEvent.type(seats, "3");
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

    render(<TripForm />);

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
    mockPost.mockResolvedValueOnce({
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

    expect(mockPost).toHaveBeenCalledWith("/trips/tariff/suggest", {
      distanceKm: 12.5,
      durationMinutes: 25
    });

    expect(await screen.findByText(/Tarifa sugerida:/)).toBeInTheDocument();

    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "5000");

    const form = screen.getByRole("button", { name: /Publicar viaje/i }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form);

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const alerts = screen.queryAllByText((_, element) =>
        element?.textContent?.includes("El precio debe estar entre")
      );
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});
