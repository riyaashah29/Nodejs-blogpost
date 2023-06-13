const jwt = require("jsonwebtoken");
const User = require("../models/user");

require("dotenv").config();

exports.isauth = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not Authenticated");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[0];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("Not authenticated.");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  req.role = decodedToken.role;
  req.name = decodedToken.name;
  next();
};

exports.checkrole = (roles) => async (req, res, next) => {
  if (!req.role || !roles.includes(req.role)) {
    return res
      .status(401)
      .json({ message: `Sorry, you cannot access this route as ${req.role}` });
  }
  next();
};

exports.checkstatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(500).json({ message: "User not found" });
    }
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "User inactive",
      });
    } else {
      next();
    }
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
