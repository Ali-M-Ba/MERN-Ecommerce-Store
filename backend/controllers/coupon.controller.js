import mongoose from "mongoose";
import Coupon from "../models/Coupon.model.js";
import { handleError } from "../utils/error.handler.js";
import { handleResponse } from "../utils/response.handler.js";

export const createCoupon = async (req, res) => {
  const { code, discountPercentage, expirationDate, userId } = req.body;

  if (!code || !discountPercentage || !expirationDate || !userId) {
    return handleError(res, {
      status: 400,
      message: "All fields are required!",
    });
  }

  const newCoupon = new Coupon(req.body);

  try {
    const savedCoupon = await newCoupon.save();
    handleResponse(res, 201, "Coupon created successfully!", { savedCoupon });
  } catch (error) {
    console.error("Error creating the coupon: ", error);
    handleError(res, error);
  }
};

export const validateCoupon = async (req, res) => {
  const { code } = req.body;
  const { _id: userId } = req.user;

  try {
    const coupon = await Coupon.findOne({ code, userId, isActive: true });

    if (!coupon) {
      return handleError(res, { status: 404, message: "Coupon not found!" });
    }

    if (coupon.isExpired()) {
      // Another option if you want to delete the expired coupons
      // const deletedCoupon =  await Coupon.findByIdAndDelete(coupon._id);
      // if (!deletedCoupon) {
      //   return handleError(res, { status: 500, message: "Failed to delete expired coupon." });
      // }
      coupon.isActive = false;
      coupon.save();

      return handleError(res, {
        status: 410,
        message: "This coupon has expired.",
      });
    }

    handleResponse(res, 200, "Valid coupon!", {
      _id: coupon._id,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.error("Error validating coupon: ", error);
    handleError(res, error);
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().lean();

    handleResponse(res, 200, "Coupons retrieved successfully!", { coupons });
  } catch (error) {
    console.error("Error fetching coupons: ", error);
    handleError(res, error);
  }
};

export const getCoupon = async (req, res) => {
  const { id: couponId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return handleError(res, { status: 400, message: "Invalid coupon ID!" });
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return handleError(res, { status: 404, message: "Coupon not found!" });
    }

    handleResponse(res, 200, "Coupon retrieved successfully!", { coupon });
  } catch (error) {
    console.error("Error fetching coupon: ", error);
    handleError(res, error);
  }
};

export const deleteCoupon = async (req, res) => {
  const { id: couponId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return handleError(res, { status: 400, message: "Invalid coupon ID!" });
    }

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
      return handleError(res, { status: 404, message: "Coupon not found!" });
    }

    handleResponse(res, 200, "Coupon Deleted successfully!", { deletedCoupon });
  } catch (error) {
    console.error("Error deleting coupon: ", error);
    handleError(res, error);
  }
};

export const updateCoupon = async (req, res) => {
  const { id: couponId } = req.params;
  const couponData = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return handleError(res, { status: 400, message: "Invalid coupon ID!" });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, couponData, {
      new: true,
    });

    if (!updatedCoupon) {
      return handleError(res, {
        status: 404,
        message: "Coupon not found!",
      });
    }

    handleResponse(res, 200, "Coupon updated successfully!", {
      updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon: ", error);
    handleError(res, error);
  }
};
