import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AddPickupPointsDriver from "../features/AddPickupPointsDriver/index.jsx";
import CalculateDistanceSystem from "../features/CalculateDistanceSystem/index.jsx";

export default [
  <Route
    key="add-pickup"
    path="/features/add-pickup-points"
    element={
      <ProtectedRoute>
        <AddPickupPointsDriver />
      </ProtectedRoute>
    }
  />,
  <Route
    key="calc-distance"
    path="/features/calculate-distance"
    element={
      <ProtectedRoute>
        <CalculateDistanceSystem />
      </ProtectedRoute>
    }
  />
];
