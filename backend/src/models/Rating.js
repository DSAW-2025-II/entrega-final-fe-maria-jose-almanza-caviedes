// Rating model enabling user-to-user feedback after trips (drivers and passengers).
import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    // Author of the rating.
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Recipient of the rating.
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Score range validation (1 to 5 stars).
    score: { type: Number, min: 1, max: 5, required: true },

    // Optional comment for qualitative feedback.
    comment: String
  },
  { timestamps: true }
);

export default mongoose.model("Rating", ratingSchema);
