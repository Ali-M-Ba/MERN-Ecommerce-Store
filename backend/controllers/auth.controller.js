import User from "../models/User.model.js";
import RefreshToken from "../models/RefreshToken.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { handleResponse } from "../utils/response.handler.js";
import { handleError } from "../utils/error.handler.js";
import { generateTokens, setCookies } from "../utils/token.utils.js";

export const processSignup = async (req, res) => {
  try {
    const credentials = req.body;
    const newUser = new User(credentials);
    const savedUser = await newUser.save();

    const { accessToken, refreshToken } = generateTokens(savedUser._id);

    const newToken = new RefreshToken({
      userId: savedUser._id,
      refreshToken,
      expiresAt: new Date(
        Date.now() + parseInt(process.env.REFRESH_TOKEN_MAX_AGE, 10)
      ),
    });

    await newToken.save();

    handleResponse(res, 201, "User signed up successfully!", {
      userId: savedUser._id,
      role: savedUser.role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("Error accurred while signing up a new user: ", error);
    handleError(res, error);
  }
};

export const processLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("Invalid email or password");
      error.status = 401; // Unauthorized
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.status = 401; // Unauthorized
      throw error;
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    const newToken = new RefreshToken({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(
        Date.now() + parseInt(process.env.REFRESH_TOKEN_MAX_AGE, 10)
      ),
    });

    await newToken.save();
    setCookies(res, accessToken, refreshToken);

    handleResponse(res, 200, "User logged in successfully!", {
      userId: user._id,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("Error acurred while logging in the user: ", error);
    handleError(res, error);
  }
};

export const processLogout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      const error = new Error("Refresh token not found");
      error.status = 404;
      throw error;
    }

    const { userId } = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const token = await RefreshToken.findOne({ userId });
    if (!token || !(await token.verifyToken(refreshToken))) {
      throw new Error("Invalid refresh token");
    }

    await token.deleteOne();

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    handleResponse(res, 200, "Logged out successfully!");
  } catch (error) {
    console.log("Error accurred while logging out the user: ", error);
    handleError(res, error);
  }
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  // console.log("the refresh token that stored in the cookies: ", refreshToken);
  try {
    if (!refreshToken) {
      const error = new Error("Refresh token not found");
      error.status = 404; // Not found
      throw error;
    }

    const { userId } = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const storedToken = await RefreshToken.findOne({ userId });
    if (!storedToken || !(await storedToken.verifyToken(refreshToken))) {
      const error = new Error("Invalid refresh token");
      error.status = 401; // Unauthorized
      throw error;
    }

    const { accessToken } = generateTokens(userId);

    setCookies(res, refreshToken, accessToken);

    handleResponse(res, 201, "Access token refreshed successfully!", {
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("Error accurred while refreshing the access token: ", error);
  }
};
