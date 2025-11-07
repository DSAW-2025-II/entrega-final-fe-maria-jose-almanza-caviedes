// Vehicle model linking driver ownership, capacity, and document evidence.
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    // Reference to the owning user (driver). Enforces authorization on CRUD operations.
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Plate identifier; enforce upper-case and uniqueness to prevent duplicates.
    plate: { type: String, required: true, uppercase: true, unique: true, trim: true },

    // Vehicle brand/model info for UI.
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },

    // Number of seats available for passengers (driver excluded).
    capacity: { type: Number, required: true, min: 1, max: 8 },

    // Optional URLs to uploaded evidence (Cloud storage or CDN).
    vehiclePhotoUrl: { type: String, trim: true },
    soatPhotoUrl: { type: String, trim: true },

    // Regulatory compliance metadata.
    soatExpiration: { type: Date, required: true },
    licenseNumber: { type: String, required: true, trim: true },
    licenseExpiration: { type: Date, required: true },

    pickupPoints: [
      {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
