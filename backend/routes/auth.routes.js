import express from "express";
import dotenv from "dotenv";
import {
  processLogin,
  processLogout,
  processSignup,
  refreshToken,
} from "../controllers/auth.controller.js";

dotenv.config();

const router = express.Router();

router.post("/signup", processSignup);
router.post("/login", processLogin);
router.post("/logout", processLogout);
router.post("/refresh-token", refreshToken);

export default router;
