const express = require("express");
const { body } = require("express-validator");

const isAuthmiddleware = require("../middleware/is-auth");
const { isSubscribed } = require("../middleware/is-subscribed");
const authController = require("../controllers/auth");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please Enter a valid Email.")
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }).withMessage('Minimum Password length should be 5'),
    body("name").trim().not().isEmpty().withMessage('Please Enter valid name'),
  ],
  authController.signup
);

router.post("/login", authController.login);

router.put(
  "/update-password",
  [body("newpassword").trim().isLength({ min: 5 }).withMessage('Minimum Password length should be 5')],
  isAuthmiddleware.isauth,
  isAuthmiddleware.checkstatus,
  isSubscribed,
  authController.updatePassword
);

module.exports = router;
