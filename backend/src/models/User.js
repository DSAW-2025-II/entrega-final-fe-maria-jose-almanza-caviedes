// User model representing authenticated platform users (students/drivers).
import mongoose from "mongoose";

const allowedRoles = ["passenger", "driver"];

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Unique institutional email used as the primary identifier for login.
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },

    // Core identity fields required by registration flows.
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    universityId: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    // Optional avatar stored in object storage (S3, Cloudinary, etc.).
    photoUrl: { type: String, trim: true },

    // Emergency contact details provided for safety coordination.
    emergencyContact: { type: emergencyContactSchema, default: null },

    // Preferred payment method (for informational purposes only).
    preferredPaymentMethod: {
      type: String,
      enum: ["cash", "nequi"],
      default: "cash"
    },

    // Active vehicle reference when user is in driver mode; ensures trip creation knows which vehicle to use.
    activeVehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },

    // Hashed password (bcrypt). Never store plaintext passwords for security.
    passwordHash: { type: String, required: true },

    // Roles that the user is allowed to assume in the app.
    roles: {
      type: [String],
      enum: allowedRoles,
      default: ["passenger"],
      validate: {
        validator: (roles) => Array.isArray(roles) && roles.length > 0,
        message: "El usuario debe tener al menos un rol asignado"
      }
    },

    // Current role selected by the user (passenger/driver).
    activeRole: { type: String, enum: allowedRoles, default: "passenger" }
  },
  { timestamps: true } // Adds createdAt/updatedAt for auditing and sorting.
);

// Ensure activeRole is always part of roles to avoid inconsistent state.
userSchema.pre("validate", function ensureActiveRole() {
  if (!this.roles?.includes(this.activeRole)) {
    this.activeRole = this.roles?.[0] || "passenger";
  }
});

export default mongoose.model("User", userSchema);
