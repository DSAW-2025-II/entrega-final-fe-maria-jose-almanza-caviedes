// Trip model for ride offers: origin, destination, timing, capacity, and booking state.
import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    // Driver who created the trip.
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Vehicle used for the trip (optional if driver has multiple).
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

    // Free-form origin/destination (could be addresses or "lat,lng" strings).
    origin: String,
    destination: String,

    // Planned departure date/time.
    departureAt: Date,

    // Remaining seats (decremented atomically on booking).
    seatsAvailable: { type: Number, default: 3 },

    // Suggested price (estimated from distance/ETA or driver input).
    priceSuggested: Number,

    // Booked passengers (user IDs). Used to prevent double-booking and for ratings.
    passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export default mongoose.model("Trip", tripSchema);
