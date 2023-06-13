const User = require("../models/user");

const isSubscribed = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(500).json({ message: "User not found" });
    }
    if (!user.subscribed) {
      return res.status(403).json({
        message: "Sorry, you need to be subscribed to access this route",
      });
    } else {
      next();
    }
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { isSubscribed };
