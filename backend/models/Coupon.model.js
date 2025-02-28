import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "The Code field is require."],
      unique: true,
    },
    discountPercentage: {
      type: Number,
      required: [true, "The discount percentage field is require."],
      min: 0,
      max: 100,
    },
    expirationDate: {
      type: Date,
      required: [true, "The expiration date field is require."],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stripeCouponId: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// Method to check expiration
couponSchema.methods.isExpired = function () {
  return this.expirationDate && this.expirationDate < Date.now();
};

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
