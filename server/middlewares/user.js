import { sendError } from "../controllers/utils/helper.js";
import passwordResetToken from "../db/passwordResetToken.js";
import mongoose from "mongoose";

export const isValidPassResetToken = async (req, res, next) => {
  const { token, userId } = req.body;

  if (!token.trim() || !mongoose.isValidObjectId(userId))
    return sendError(res, "Invalid request!");

  const resetToken = await passwordResetToken.findOne({ owner: userId });
  if (!resetToken)
    return sendError(res, "Unauthorized access, invalid request.");

  const matchedToken = await resetToken.compareToken(token);
  if (!matchedToken)
    return sendError(res, "Unauthorized access, invalid request.");

  req.resetToken = resetToken;
  next();
};
