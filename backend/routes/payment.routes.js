import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  handlePaymentSuccess,
  initiateCheckout,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectedRoute, initiateCheckout);
router.post("/purchase-success", protectedRoute, handlePaymentSuccess);

export default router;
