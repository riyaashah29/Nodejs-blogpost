const express = require("express");
const { body } = require("express-validator");

const isAuthmiddleware = require("../middleware/is-auth");
const authController = require("../controllers/auth");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please Enter a valid Email.")
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post("/login", authController.login);

router.put(
  "/update-password",
  [body("newpassword").trim().isLength({ min: 5 })],
  isAuthmiddleware.isauth,
  authController.updatePassword
);

module.exports = router;
