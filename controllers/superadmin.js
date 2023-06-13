const Admin = require("../models/admin");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

exports.getAdmins = async (req, res, next) => {
  try {
    const admin = await Admin.find().select("_id email name")
    res.status(200).json({
      message: "Fetched Admins successfully.",
      admins: admin,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.deleteAdmin = async (req, res, next) => {
  const adminId = req.params.adminId;
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      const error = new Error("Could not find admin!");
      error.statusCode = 404;
      throw error;
    }
    await Admin.findByIdAndRemove(adminId);
    res.status(200).json({ message: "Deleted admin" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.superadminDeletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    await Comment.deleteMany({ _id: post.comments });
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(post.author);
    user.posts.pull(postId);
    await user.save();
    res.status(200).json({ message: "Deleted post" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
