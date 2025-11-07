// Trip model for ride offers: origin, destination, timing, capacity, and booking state.
import mongoose from "mongoose";

const pickupPointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seats: { type: Number, required: true, min: 1 },
    pickupPoints: [{ type: pickupPointSchema, required: true }],
    paymentMethod: { type: String, enum: ["cash", "nequi"], default: "cash" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "rejected"],
      default: "pending"
    },
    decisionAt: { type: Date }
  },
  { _id: true, timestamps: true }
);

const tripSchema = new mongoose.Schema(
  {
    // Driver who created the trip.
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Vehicle used for the trip.
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },

    // Free-form origin/destination (addresses or campus references).
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    routeDescription: { type: String, trim: true },

    // Planned departure date/time.
    departureAt: { type: Date, required: true },

    // Capacity management: total seats and remaining seats.
    seatsTotal: { type: Number, required: true, min: 1 },
    seatsAvailable: { type: Number, required: true, min: 0 },

    // Price per passenger.
    pricePerSeat: { type: Number, required: true, min: 0 },

    // Pickup points available for passengers.
    pickupPoints: [pickupPointSchema],

    // Suggested distance/ETA for informational purposes.
    distanceKm: { type: Number },
    durationMinutes: { type: Number },

    // Trip status lifecycle.
    status: {
      type: String,
      enum: ["scheduled", "full", "cancelled", "completed"],
      default: "scheduled"
    },

    // Embedded reservations for quick lookup. For large scale, move to separate collection.
    reservations: [reservationSchema]
  },
  { timestamps: true }
);

tripSchema.pre("validate", function handleSeatConsistency() {
  if (typeof this.seatsTotal === "number" && this.seatsTotal >= 0) {
    if (this.seatsAvailable == null) {
      this.seatsAvailable = this.seatsTotal;
    }
    this.seatsAvailable = Math.min(this.seatsAvailable, this.seatsTotal);
  }
  if (this.seatsAvailable === 0 && this.status === "scheduled") {
    this.status = "full";
  }
  if (this.seatsAvailable > 0 && this.status === "full") {
    this.status = "scheduled";
  }
});

export default mongoose.model("Trip", tripSchema);
