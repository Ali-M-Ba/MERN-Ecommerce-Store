import mongoose from "mongoose";
import User from "../models/User.model.js";
import { handleError } from "../utils/error.handler.js";
import { handleResponse } from "../utils/response.handler.js";

export const getCartProducts = async (req, res) => {
  const user = req.user;
  try {
    const populateProducts = await User.findById(user._id).populate({
      path: "cartItems.product",
      select: "name price image category",
    });

    // Handle Cases Where Products Might Be Deleted
    // Remove cart items where product is null (deleted products)
    //   {
    //     "product": null,
    //     "quantity": 2,
    //     "_id": "67ad2f59691b1cf18cb7e7ac"
    // },
    const filteredCart = populateProducts.cartItems.filter(
      (item) => item.product
    );

    handleResponse(res, 200, "Retrieved cart's products successfully!", {
      cart: filteredCart,
    });
  } catch (error) {
    console.error("Error retrieving cart products: ", error);
    handleError(res, error);
  }
};

export const addToCart = async (req, res) => {
  const user = req.user;
  const { id: productId, quantity = 1 } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return handleError(res, { status: 400, message: "Invalid product ID!" });
    }

    if (quantity < 0) {
      return handleError(res, {
        status: 400,
        message: "Quantity must be a positive number!",
      });
    }

    const existingProduct = user.cartItems.find((item) =>
      item.product.equals(productId)
    );

    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      user.cartItems.push({ product: productId, quantity });
    }

    await user.save();

    handleResponse(res, 201, "Product added to cart successfully!", {
      cart: user.cartItems,
    });
  } catch (error) {
    console.error("Error adding product to cart: ", error);
    handleError(res, error);
  }
};

export const updateQuantity = async (req, res) => {
  const user = req.user;
  const { id: productId } = req.params;
  const { quantity } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return handleError(res, { status: 400, message: "Invalid product ID!" });
    }

    if (quantity < 0) {
      return handleError(res, {
        status: 400,
        message: "Quantity must be a positive number!",
      });
    }

    const existingProduct = user.cartItems.find((item) =>
      item.product.equals(productId)
    );

    if (!existingProduct) {
      return handleError(res, {
        status: 404,
        message: "Product not found in cart!",
      });
    }

    if (quantity === 0) {
      user.cartItems = user.cartItems.filter((item) => !item.product.equals);
    } else {
      existingProduct.quantity = quantity;
    }
    await user.save();

    handleResponse(res, 200, "Cart updated successfully!", {
      cart: user.cartItems,
    });
  } catch (error) {
    console.error("Error updating cart quantity: ", error);
    handleError(res, error);
  }
};

export const removeProduct = async (req, res) => {
  const user = req.user;
  const { id: productId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return handleError(res, { status: 400, message: "Invalid product ID!" });
    }

    const initialLength = user.cartItems.length;
    user.cartItems = user.cartItems.filter(
      (item) => !item.product.equals(productId)
    );

    if (user.cartItems.length === initialLength) {
      return handleError(res, {
        status: 404,
        message: "Product not found in cart!",
      });
    }

    await user.save();
    handleResponse(res, 200, "Product removed from cart successfully!", {
      cart: user.cartItems,
    });
  } catch (error) {
    console.error("Error removing product from cart: ", error);
    handleError(res, error);
  }
};

export const clearCart = async (req, res) => {
  const user = req.user;

  try {
    if (user.cartItems.length === 0) {
      return handleError(res, {
        status: 400,
        message: "Cart is already empty!",
      });
    }

    user.cartItems = [];
    await user.save();

    handleResponse(res, 200, "Cart cleared successfully!", {
      cart: user.cartItems,
    });
  } catch (error) {
    console.error("Error clearing cart: ", error);
    handleError(res, error);
  }
};
