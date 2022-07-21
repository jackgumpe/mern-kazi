import express from "express";
import {
  createUser,
  forgetPassword,
  resendEmailVerificationToken,
  resetPassword,
  sendResetPasswordTokenStatus,
  signIn,
  verifyEmail,
} from "../controllers/user.js";
import {
  signInValidator,
  userValidator,
  validate,
  validatePassword,
} from "../middlewares/validator.js";
import { isValidPassResetToken } from "../middlewares/user.js";

export const router = express.Router();

router.post("/create", userValidator, validate, createUser);
router.post("/sign-in", signInValidator, validate, signIn);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification-token", resendEmailVerificationToken);
router.post("/forget-password", forgetPassword);
router.post(
  "/verify-pass-reset-token",
  isValidPassResetToken,
  sendResetPasswordTokenStatus
);
router.post(
  "/reset-password",
  validatePassword,
  validate,
  isValidPassResetToken,
  resetPassword
);
