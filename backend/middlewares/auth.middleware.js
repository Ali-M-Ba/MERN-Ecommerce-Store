import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import { handleError } from "../utils/error.handler.js";

const verifyTokenAndFetchUser = async (token) => {
  if (!token) {
    const error = new Error("Access token not provided.");
    error.status = 401; // Unauthorized
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    const error = new Error("Invalid or expired access token.");
    error.status = 401; // Unauthorized
    throw error;
  }

  const user = await User.findById({ _id: decoded.userId }).select("-password");
  if (!user) {
    const error = new Error("User not found.");
    error.status = 404; // Not Found
    throw error;
  }

  return user;
};

export const protectedRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const user = await verifyTokenAndFetchUser(accessToken);

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectedRoute middleware:", error);
    handleError(res, error);
  }
};

export const adminRoute = async (req, res, next) => {
  try {
    // const accessToken = req.cookies.accessToken;
    // const user = await verifyTokenAndFetchUser(accessToken);

    if (req.user.role !== "admin") {
      const error = new Error("Access denied - admin only!");
      error.status = 403; // Forbidden
      throw error;
    }
    next();
  } catch (error) {
    console.error("Error in adminRoute middleware:", error);
    handleError(res, error);
  }
};
