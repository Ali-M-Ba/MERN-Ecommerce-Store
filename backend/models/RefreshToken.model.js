import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      immutable: true, // Prevents token from being modified after creation
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash the token
refreshTokenSchema.pre("save", async function (next) {
  try {
    // Only hash the token if it is new or modified
    if (this.isModified("refreshToken")) {
      const saltRounds = 10; // Recommended bcrypt salt rounds
      this.refreshToken = await bcrypt.hash(this.refreshToken, saltRounds);
    }
    next();
  } catch (error) {
    next(error); // Pass the error to the next middleware
  }
});

// Verify token method (optional, for checking hashed tokens)
refreshTokenSchema.methods.verifyToken = async function (plainToken) {
  console.log("the plainToken while verfiying it: ", plainToken);
  return bcrypt.compare(plainToken, this.refreshToken);
};

// Method to check if the token if expired
refreshTokenSchema.methods.isExpired = function () {
  return Date.now() >= this.expiresAt; // ture if the token expired
};

// Method to revoke the token
refreshTokenSchema.methods.revoke = function () {
  return (this.revoked = true);
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
