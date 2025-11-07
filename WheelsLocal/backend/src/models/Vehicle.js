// Vehicle model linking driver ownership, capacity, and optional pickup points for routes.
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    // Reference to the owning user (driver). Enforces authorization on CRUD operations.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Plate identifier; required for unique vehicle distinction (enforce format in validation layer if needed).
    plate: { type: String, required: true },

    // Vehicle brand/model info for UI.
    brand: String,

    // Number of seats available for passengers (driver excluded).
    seats: { type: Number, default: 4 },

    // Optional list of pickup points curated by the driver for common routes.
    pickupPoints: [{ name: String, lat: Number, lng: Number }]
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
