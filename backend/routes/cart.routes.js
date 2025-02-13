import express from "express";
import {
  getCartProducts,
  addToCart,
  updateQuantity,
  removeProduct,
  clearCart,
} from "../controllers/cart.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protectedRoute, getCartProducts);
router.post("/", protectedRoute, addToCart);
router.put("/:id", protectedRoute, updateQuantity);
router.delete("/:id", protectedRoute, removeProduct);
router.delete("/", protectedRoute, clearCart);

export default router;
