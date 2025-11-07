// User model representing authenticated platform users (students/drivers).
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Unique institutional email used as the primary identifier for login.
    email: { type: String, unique: true, required: true },

    // Display name shown in UI and ratings.
    name: String,

    // Hashed password (bcrypt). Never store plaintext passwords for security.
    passwordHash: String
  },
  { timestamps: true } // Adds createdAt/updatedAt for auditing and sorting.
);

export default mongoose.model("User", userSchema);
