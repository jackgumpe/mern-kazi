import user from "../db/model.js";
import emailVerificationToken from "../db/emailVerificationToken.js";
import passwordResetToken from "../db/passwordResetToken.js";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import mongoose from "mongoose";
import { generateMailTransporter, generateOTP } from "./utils/mail.js";
import { generateRandomByte, sendError } from "./utils/helper.js";
import { mkdirSync } from "fs";

export const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  const oldUserEmail = await user.findOne({ email });
  const oldUserPassword = await user.findOne({ password });

  if (oldUserEmail || oldUserPassword) {
    return sendError(res, "This email or password is already in use");
  }

  const newUser = new user({ name, email, password });
  await newUser.save();

  // generate 6 digit otp
  let OTP = generateOTP();

  // store otp inside our do
  const newEmailVerificationToken = new emailVerificationToken({
    owner: newUser._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();

  // send that otp to our user
  var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "b61f69d375146e",
      pass: "6cff3def014db8",
    },
  });

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: newUser.email,
    subject: "Email Verification",
    html: `
      <p>Your verification OTP</p>
      <h1>${OTP}</h1>
    `,
  });

  res.status(201).json({
    message:
      "Please verify your email. OTP has been sent to your email account!",
  });
};

export const verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    return res.json({ error: "Invalid user!" });
  }

  const User = await user.findById(userId);
  if (!User) return sendError(res, "user not found!", 404);

  if (User.isVerified) return sendError(res, "user is already verified");

  const token = await emailVerificationToken.findOne({ owner: userId });
  if (!token) return sendError(res, "token not found");

  const isMatched = await token.compareToken(OTP);
  if (!isMatched) return sendError(res, "Please submit a valid OTP.");

  User.isVerified = true;
  await User.save();

  await emailVerificationToken.findByIdAndDelete(token._id);

  // send that otp to our user
  var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "b61f69d375146e",
      pass: "6cff3def014db8",
    },
  });

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: User.email,
    subject: "Welcome Email",
    html: "<h1>Welcome to our app and thanks for choosing us.</h1>",
  });
  res.json({ message: "Your email is verified." });
};

export const resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;

  const User = await user.findById(userId);
  if (!User) return sendError(res, "user not found!");

  if (user.isVerified) return sendError(res, "This email is already verified");

  const alreadyHasToken = await emailVerificationToken.findOne({
    owner: userId,
  });

  if (alreadyHasToken)
    return sendError(
      res,
      "Only one token is generated per hour. Please wait until the allotted time."
    );

  // generate 6 digit otp
  let OTP = generateOTP();

  // store otp inside our do
  const newEmailVerificationToken = new emailVerificationToken({
    owner: User._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();

  // send that otp to our user
  var transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: User.email,
    subject: "Email Verification",
    html: `
      <p>Your verification OTP</p>
      <h1>${OTP}</h1>
    `,
  });

  res.json({
    message: "New OTP has been sent to your registered email account.",
  });
};

export const forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return sendError(res, "email is missing.");

  const User = await user.findOne({ email });
  if (!User) return sendError(res, "User not found!", 404);

  const alreadyHasToken = await passwordResetToken.findOne({ owner: User._id });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token."
    );

  const token = await generateRandomByte();
  const newPasswordResetToken = await passwordResetToken({
    owner: User._id,
    token,
  });
  await newPasswordResetToken.save();

  const resetPasswordUrl = `http://localhost:3000/reset-password?token=${token}&id=${User._id}`;

  var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "b61f69d375146e",
      pass: "6cff3def014db8",
    },
  });

  transport.sendMail({
    from: "security@reviewapp.com",
    to: User.email,
    subject: "Reset password link.",
    html: ` 
          <p>Click here to reset password</p>
          <a href='${resetPasswordUrl}'>Change Password</a>
          
        `,
  });
  res.json({ message: "Link sent to your email." });
};

export const sendResetPasswordTokenStatus = (req, res) => {
  res.json({ valid: true });
};

export const resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;

  const User = await user.findById(userId);
  const matched = await User.comparePassword(newPassword);
  if (matched)
    return sendError(
      res,
      "The new password must be different from the old one!"
    );

  User.password = newPassword;
  await User.save();

  await passwordResetToken.findByIdAndDelete(req.resetToken._id);

  var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "b61f69d375146e",
      pass: "6cff3def014db8",
    },
  });

  transport.sendMail({
    from: "security@reviewapp.com",
    to: User.email,
    subject: "Password Reset Successfully.",
    html: ` 
          <h1>Password Reset Successful.</h1>
          <p>Now you can use new password.</p>
          
        `,
  });

  res.json({ message: "Password Reset Successful." });
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  const User = await user.findOne({ email });
  if (!User) return sendError(res, "Email/Password mismatch");

  const matched = await User.comparePassword(password);
  if (!matched) return sendError(res, "Email/Password mismatch!");

  const { _id, name } = User;

  const jwtToken = jsonwebtoken.sign({ userId: _id }, process.env.JWT_SECRET);

  res.json({ user: { id: _id, name, email, token: jwtToken } });
};
