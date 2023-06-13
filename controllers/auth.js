const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Admin = require("../models/admin");
const SuperAdmin = require("../models/super-admin");
const nodemailer = require("nodemailer");

require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.signup = async (req, res, next) => {
  const baseRole = req.baseUrl.split("/")[1];
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array() });
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const role = baseRole;
  try {
    // Check if email already exists
    const userExists = await User.findOne({ email: email });
    const adminExists = await Admin.findOne({ email: email });
    const superAdminExists = await SuperAdmin.findOne({ email: email });
    if (userExists || adminExists || superAdminExists) {
      const error = new Error("Email already exists.");
      error.statusCode = 422;
      throw error;
    }

    let user;
    const hashedPassword = await bcrypt.hash(password, 12);
    if (role === "admin") {
      user = new Admin({
        email: email,
        password: hashedPassword,
        name: name,
        role: role,
      });
    } else if (role === "superadmin") {
      const superAdminCount = await SuperAdmin.countDocuments();
      if (superAdminCount >= 1) {
        return res
          .status(422)
          .json({ message: "Another SuperAdmin signup is not allowed." });
      }
      user = new SuperAdmin({
        email: email,
        password: hashedPassword,
        name: name,
        role: role,
      });
    } else {
      user = new User({
        email: email,
        password: hashedPassword,
        name: name,
        role: role,
      });
    }
    const result = await user.save();
    res.status(201).json({
      message: "User Created!",
      userId: result._id,
      role: result.role,
    });
    // send email for successful signup
    return transporter.sendMail({
      from: process.env.EMAIL_ID,
      to: email,
      subject: "Welcome to Blog site",
      html: "Successful signup",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const baseRole = req.baseUrl.split("/")[1];
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  try {
    let user;
    if (baseRole === "superadmin") {
      user = await SuperAdmin.findOne({ email: email });
    } else if (baseRole === "admin") {
      user = await Admin.findOne({ email: email });
    } else {
      user = await User.findOne({ email: email });
      if (user && user.status !== "active") {
        return res
          .status(403)
          .json({ message: "This user has been deActivated currently" });
      }
    }
    if (!user) {
      const error = new Error("A user with this email could not be found.");
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Wrong Password.");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
        role: loadedUser.role,
        name: loadedUser.name,
      },
      process.env.TOKEN_SECRET_KEY,
      { expiresIn: "1h" }
    );
    return res.status(200).json({
      token: token,
      userId: loadedUser._id.toString(),
      role: loadedUser.role,
      name: loadedUser.name,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  const baseRole = req.baseUrl.split("/")[1];
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array() });
  }
  const oldPassword = req.body.oldpassword;
  const newPassword = req.body.newpassword;
  try {
    let user;
    if (baseRole === "superadmin") {
      user = await SuperAdmin.findById(req.userId);
    } else if (baseRole === "admin") {
      user = await Admin.findById(req.userId);
    } else {
      user = await User.findById(req.userId);
    }
    if (!user) {
      const error = new Error("A user with this email could not be found.");
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(oldPassword, user.password);
    if (!isEqual) {
      const error = new Error("Your old Password is incorrect.");
      error.statusCode = 401;
      throw error;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({
      message: "Password Updated Successfully",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
