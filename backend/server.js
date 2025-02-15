import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js";
import couponRouter from "./routes/coupon.routes.js";
import cookieParser from "cookie-parser";
import { seedProducts } from "./seeds/product.seed.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/products", productRouter);
app.use("/cart", cartRouter);
app.use("/coupons", couponRouter);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
// seedProducts(); // The products seed function
