import express from "express";
import { adminRoute, protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createCoupon,
  deleteCoupon,
  getCoupon,
  getCoupons,
  updateCoupon,
  validateCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();

router.post("/", protectedRoute, adminRoute, createCoupon);
router.get("/", protectedRoute, adminRoute, getCoupons);
router.get("/:id", protectedRoute, getCoupon);
router.post("/validate", protectedRoute, adminRoute, validateCoupon);
router.put("/:id", protectedRoute, adminRoute, updateCoupon);
router.delete("/:id", protectedRoute, adminRoute, deleteCoupon);

export default router;
