import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddPickupPointsDriver from "./index.jsx";

jest.mock("../../context/AuthContext.jsx", () => ({
  useAuth: jest.fn()
}));

jest.mock("../../utils/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

const { useAuth } = jest.requireMock("../../context/AuthContext.jsx");
const api = jest.requireMock("../../utils/api");

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({
    user: {
      roles: ["driver"],
      activeVehicle: "veh1"
    }
  });
});

test("renders saved pickup points for the active vehicle", async () => {
  api.get.mockResolvedValue({
    data: {
      vehicles: [
        {
          _id: "veh1",
          brand: "Renault",
          model: "Logan",
          plate: "AAA111",
          pickupPoints: [
            { _id: "p1", name: "Puente Madera", description: "Entrada", lat: 4.86, lng: -74.05 }
          ]
        }
      ],
      activeVehicle: "veh1"
    }
  });

  render(<AddPickupPointsDriver />);

  expect(await screen.findByText("Puente Madera")).toBeInTheDocument();
  expect(screen.getByText("Entrada")).toBeInTheDocument();
});

test("creates a pickup point for the selected vehicle", async () => {
  api.get
    .mockResolvedValueOnce({
      data: {
        vehicles: [
          {
            _id: "veh1",
            brand: "Renault",
            model: "Logan",
            plate: "AAA111",
            pickupPoints: []
          }
        ],
        activeVehicle: "veh1"
      }
    })
    .mockResolvedValueOnce({
      data: {
        vehicles: [
          {
            _id: "veh1",
            brand: "Renault",
            model: "Logan",
            plate: "AAA111",
            pickupPoints: [
              {
                _id: "p2",
                name: "Ad Portas",
                description: "Frente a Ad Portas",
                lat: 4.87,
                lng: -74.04
              }
            ]
          }
        ],
        activeVehicle: "veh1"
      }
    });

  api.post.mockResolvedValue({
    data: {
      pickupPoint: {
        _id: "p2",
        name: "Ad Portas",
        description: "Frente a Ad Portas",
        lat: 4.87,
        lng: -74.04
      }
    }
  });

  render(<AddPickupPointsDriver />);

  await screen.findByText("Agregar nuevo punto");

  fireEvent.change(screen.getByPlaceholderText("Puente Madera"), { target: { value: "Ad Portas" } });
  fireEvent.change(screen.getByPlaceholderText("Frente a la entrada"), {
    target: { value: "Frente a Ad Portas" }
  });
  fireEvent.change(screen.getByPlaceholderText("4.8623"), { target: { value: "4.87" } });
  fireEvent.change(screen.getByPlaceholderText("-74.0509"), { target: { value: "-74.04" } });

  fireEvent.click(screen.getByRole("button", { name: "Agregar punto" }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith("/vehicles/veh1/pickup-points", {
      name: "Ad Portas",
      description: "Frente a Ad Portas",
      lat: 4.87,
      lng: -74.04
    });
  });

  expect(await screen.findByText("Punto agregado correctamente")).toBeInTheDocument();
  expect(await screen.findByText("Ad Portas")).toBeInTheDocument();
});
