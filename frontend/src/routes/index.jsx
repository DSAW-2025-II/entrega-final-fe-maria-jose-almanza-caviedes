import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AddPickupPointsDriver from "../features/AddPickupPointsDriver/index.jsx";
import CalculateDistanceSystem from "../features/CalculateDistanceSystem/index.jsx";
import Dashboard from "../features/Dashboard/Dashboard.jsx";
import TripList from "../features/Trips/TripList.jsx";
import TripForm from "../features/Trips/TripForm.jsx";
import VehiclesPage from "../features/Vehicles/VehiclesPage.jsx";
import ReservationsPage from "../features/Reservations/ReservationsPage.jsx";
import ProfilePage from "../features/Profile/ProfilePage.jsx";
import Logout from "../features/Auth/Logout.jsx";

export default [
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    path="/trips"
    element={
      <ProtectedRoute>
        <TripList />
      </ProtectedRoute>
    }
  />,
  <Route
    path="/trips/new"
    element={
      <ProtectedRoute>
        <TripForm />
      </ProtectedRoute>
    }
  />,
  <Route
    path="/vehicles"
    element={
      <ProtectedRoute>
        <VehiclesPage />
      </ProtectedRoute>
    }
  />,
  <Route
    path="/reservations"
    element={
      <ProtectedRoute>
        <ReservationsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    path="/profile"
    element={
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    }
  />,
  <Route
    path="/logout"
    element={
      <ProtectedRoute>
        <Logout />
      </ProtectedRoute>
    }
  />,
  <Route
    path="/features/add-pickup-points"
    element={
      <ProtectedRoute>
        <AddPickupPointsDriver />
      </ProtectedRoute>
    }
  />,
  <Route
    path="/features/calculate-distance"
    element={
      <ProtectedRoute>
        <CalculateDistanceSystem />
      </ProtectedRoute>
    }
  />
];
