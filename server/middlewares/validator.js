import { check, validationResult } from "express-validator";

export const userValidator = [
  check("name").trim().not().isEmpty().withMessage("Name is missing"),
  check("email").normalizeEmail().isEmail().withMessage("Email is invalid"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing!")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be 8 to 20 characters long"),
];

export const validatePassword = [
  check("newPassword")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing!")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be 8 to 20 characters long"),
];

export const signInValidator = [
  check("email").normalizeEmail().isEmail().withMessage("Email is invalid"),
  check("password").trim().not().isEmpty().withMessage("Password is missing!"),
];

export const validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (error.length) {
    return res.json({ error: error[0].msg });
  }

  next();
};
