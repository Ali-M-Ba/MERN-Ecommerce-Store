import Product from "../models/product.model.js";
import Coupon from "../models/Coupon.model.js";
import { stripe } from "../config/stripe.js";
import { v4 as uuidv4 } from "uuid";

// Retrieve products from the database using the provided product IDs.  
// Ensure all requested products exist, and append the corresponding quantity  
// from the user's input before returning the validated product list.
export const validateProducts = async (productsData) => {
  try {
    const productsIds = productsData.map((p) => p._id);
    const DBProducts = await Product.find({ _id: { $in: productsIds } })
      .select("name price image")
      .lean();

    if (productsData.length !== DBProducts.length) {
      const error = new Error("Some products are unavailable");
      error.status = 400;
      throw error;
    }

    return DBProducts.map((product) => {
      const orderedProduct = productsData.find(
        (p) => p._id === product._id.toString()
      );
      return {
        ...product,
        quantity: orderedProduct.quantity,
      };
    });
  } catch (error) {
    console.error("Error validating products data: ", error);
    throw error;
  }
};

// Calculates total amount and formats products into Stripe line items.
export const calculateOrderSummary = (products) => {
  let totalAmount = 0;

  const lineItems = products.map((product) => {
    const amount = Math.round(product.price * 100); // Convert to cents
    totalAmount += amount * product.quantity;

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          images: product.image ? [product.image] : [],
        },
        unit_amount: amount,
      },
      quantity: product.quantity,
    };
  });

  return { lineItems, totalAmount };
};

// Validates coupon and creates a stripe coupon
export const validateAndApplyCoupon = async (
  couponCode,
  totalAmount,
  userId
) => {
  try {
    const coupon = await Coupon.findOne({
      code: couponCode,
      userId,
      isActive: true,
    });

    if (!coupon) return null;

    let stripeCouponId = coupon.stripeCouponId;

    if (!stripeCouponId) {
      stripeCouponId = await createStripeCoupon(coupon.discountPercentage);
      coupon.stripeCouponId = stripeCouponId;
      await coupon.save();
    }

    return {
      id: stripeCouponId,
      couponCode,
      discountAmount: Math.round(
        (totalAmount * coupon.discountPercentage) / 100
      ),
    };
  } catch (error) {
    console.error("Error finding the coupon: ", error);
    throw error;
  }
};

// Creates a Stripe coupon.
const createStripeCoupon = async (discountPercentage) => {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: discountPercentage,
      duration: "once",
    });
    return coupon.id;
  } catch (error) {
    console.error("Error creating strip coupon: ", error);
    throw error;
  }
};

// Creates a Stripe checkout session.
export const generateCheckoutSession = async (
  userId,
  lineItems,
  coupon,
  products
) => {
  try {
    return await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon?.id ? [{ coupon: coupon.id }] : [],
      metadata: {
        userId: userId.toString(),
        couponCode: coupon.couponCode || "",
        productsData: JSON.stringify(
          products.map(({ _id, quantity }) => ({
            _id,
            quantity,
          }))
        ),
      },
    });
  } catch (error) {
    console.error("Error creating a stripe session: ", error);
    throw error;
  }
};

// Generates a gift coupon for users who spend above a certain threshold.
export const generateGiftCoupon = async (userId) => {
  try {
    const newCoupon = new Coupon({
      code: `GIFT${uuidv4().split("-")[0].toUpperCase()}`, // "3f1a2b4c-89d0-45ef-91f5-b3e2c4d5e6a7" => "A1B2C3D4"
      discountPercentage: 10,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      userId,
    });

    return await newCoupon.save();
  } catch (error) {
    console.log("Error generating gift coupon: ", error);
    throw error;
  }
};
