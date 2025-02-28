import { stripe } from "../config/stripe.js";
import Coupon from "../models/Coupon.model.js";
import Order from "../models/Order.model.js";
import { handleError } from "../utils/error.handler.js";
import { handleResponse } from "../utils/response.handler.js";
import {
  calculateOrderSummary,
  generateCheckoutSession,
  validateAndApplyCoupon,
  generateGiftCoupon,
  validateProducts,
} from "../utils/payment.utils.js";

export const initiateCheckout = async (req, res) => {
  const { products: productsData, couponCode } = req.body;
  const userId = req.user._id;

  try {
    if (!Array.isArray(productsData) || productsData.length === 0) {
      return handleError(res, {
        status: 400,
        message: "Invalid or No products",
      });
    }

    // Returning the validated product list and append the quantity.
    const products = await validateProducts(productsData);

    // Calculates total amount and formats products into Stripe line items.
    let { lineItems, totalAmount } = calculateOrderSummary(products);

    // Validates the provided coupon and return a stripe coupon
    const coupon = couponCode
      ? await validateAndApplyCoupon(couponCode, totalAmount, userId)
      : null;

    // Return a strip session
    const session = await generateCheckoutSession(
      userId,
      lineItems,
      coupon,
      products
    );

    handleResponse(res, 200, "Checkout session created successfully!", {
      id: session.id,
      url: session.url,
      totalAmount: session.amount_total / 100,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    handleError(res, error);
  }
};

export const handlePaymentSuccess = async (req, res) => {
  try {
    const { session_id: sessionId } = req.query;
    if (!sessionId) {
      return handleError(res, {
        status: 400,
        message: "Session ID is required",
      });
    }

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return handleError(res, { status: 404, message: "Session not found" });
    }

    if (session.payment_status !== "paid") {
      return handleError(res, {
        status: 400,
        message: "Payment not completed",
      });
    }

    const { couponCode, userId, productsData } = session.metadata;
    if (!userId || !productsData) {
      return handleError(res, {
        status: 400,
        message: "Missing required metadata",
      });
    }

    // Deactivate coupon if applied
    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode, userId },
        { isActive: false }
      );
    }

    let parsedProducts;
    try {
      parsedProducts = JSON.parse(productsData);
    } catch (error) {
      console.error(
        "Error parsing products data from session metadata: ",
        error
      );
      return handleError(res, {
        status: 400,
        message: "Invalid products metadata",
      });
    }

    // parsedProducts = {
    //   _id,
    //   quantity,
    // }
    // Returning the validated product list and append the quantity.
    const products = await validateProducts(parsedProducts);

    // Create new order
    const newOrder = new Order({
      user: userId,
      products: products.map(({ _id, name, quantity, price }) => ({
        product: _id,
        name,
        quantity,
        price,
      })),
      totalAmount: session.amount_total / 100, // Convert cents to dollars
      stripeSessionId: session.id,
      orderStatus: "paid",
    });

    const savedOrder = await newOrder.save();

    // Generates a coupon if the total amount is more than 100$
    if (session.amount_total >= 10000) {
      await generateGiftCoupon(userId);
    }

    return handleResponse(res, 200, "Order created successfully!", {
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error("Error in success checkout controller:", error);
    return handleError(res, error);
  }
};
