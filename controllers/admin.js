const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate({
        path: "author",
        select: "_id",
      })
      .populate({
        path: "comments",
        select: "description likes dislikes"
      })
      .sort({ updatedAt: -1, likes: -1, comments: -1, dislikes: 1 });
    res.status(200).json({
      message: "Fetched posts successfully.",
      posts: posts,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId).populate({
      path: "author",
      select: "_id email name posts",
    })
    .populate({
      path: "comments",
      select: "description likes dislikes"
    })
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched.", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.adminDeletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (post.dislikes.totalDislikes > 2) {
      await Comment.deleteMany({ _id: post.comments });
      await Post.findByIdAndRemove(postId);
      const user = await User.findById(post.author);
      user.posts.pull(postId);
      await user.save();
      res.status(200).json({ message: "Deleted post" });
    }
    res.status(200).json({ message: "You can't delete this post!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    const comment = post.comments.find((c) => c.toString() === commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
      post.comments.pull(commentId);
      await post.save();
      await Comment.findByIdAndRemove(commentId);
      return res.status(200).json({
        message: "Comment Deleted Successfully",
      });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const user = await User.find().select("_id email name posts");
    res.status(200).json({
      message: "Fetched Users successfully.",
      users: user,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Could not find user!");
      error.statusCode = 404;
      throw error;
    }
    await Post.deleteMany({ author: userId });
    await User.findByIdAndRemove(userId);
    res.status(200).json({ message: "Deleted user" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.changeUserStatus = async (req, res, next) => {
  const userId = req.params.userId;
  let newStatus;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Could not find user!");
      error.statusCode = 404;
      throw error;
    }
    if (user.status === "active") {
      newStatus = "inactive";
    } else {
      newStatus = "active";
    }
    user.status = newStatus;
    await user.save();
    res.status(200).json({ message: `Status changed to ${newStatus}` });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
