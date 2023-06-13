const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ "dislikes.totalDislikes": { $lt: 3 } })
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

exports.searchPost = async (req, res, next) => {
  const search = req.query.title;
  try {
    const posts = await Post.find({
      title: { $regex: search, $options: "i" },
      "dislikes.totalDislikes": { $lt: 3 },
    })
      .populate({
        path: "author",
        select: "_id",
      })
      .populate({
        path: "comments",
        select: "description likes dislikes"
      })
      .sort({ updatedAt: -1 });
    res.status(200).json({
      message: "Post found successfully.",
      posts: posts,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getSubscription = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }
    if (user.subscribed === true) {
      return res.status(409).json({
        message: "You already have a subscription.",
      });
    }
    user.subscribed = true;
    await user.save();
    res.status(200).json({
      message: "Subscribed successfully.",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const description = req.body.description;
  let comments = req.body.comments;

  if (!comments || comments === "") {
    comments = [];
  }
  let author;
  const post = new Post({
    title: title,
    description: description,
    author: req.userId,
    comments: comments,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    author = user;
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      createdBy: {
        _id: author._id,
      },
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
    const post = await Post.findById(postId)
      .populate({
        path: "author",
        select: "_id email name posts",
      })
      .populate({
        path: "comments",
        select: "description likes dislikes"
      })
      .where("dislikes.totalDislikes")
      .lt(3);
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

exports.updatePost = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const description = req.body.description;

  try {
    const post = await Post.findById(postId).populate("author");
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (post.author._id.toString() !== req.userId) {
      const error = new Error("Not authorized!");
      error.statusCode = 403;
      throw error;
    }
    post.title = title;
    post.description = description;
    await post.save();
    res.status(200).json({
      message: "Post Updated Successfully",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const comments = req.body.comments;
  try {
    const authorId = req.userId;
    const createdBy = req.name;
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    const newComment = new Comment({
      description: comments.description,
      createdBy: createdBy,
      author: authorId,
    });
    await newComment.save();
    post.comments.push(newComment);
    await post.save();
    res.status(200).json({
      message: "Comment Added Successfully",
    });
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
    const userId = req.userId;
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
    const delcomment = await Comment.findById(commentId);
    if (
      delcomment.author.toString() === userId ||
      post.author.toString() === userId
    ) {
      post.comments.pull(commentId);
      await post.save();
      await Comment.findByIdAndRemove(commentId);
      return res.status(200).json({
        message: "Comment Deleted Successfully",
      });
    }
    res
      .status(401)
      .json({ message: "You are not authorized to delete this comment" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postLike = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const user = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.likes.likedBy.includes(user)) {
      return res
        .status(400)
        .json({ message: "You have already liked this post" });
    }
    // If the user has already disliked the post, remove them from the dislikedBy array
    if (post.dislikes.disLikedBy.includes(user)) {
      post.dislikes.disLikedBy = post.dislikes.disLikedBy.filter((userId) => {
        return userId.toString() !== user.toString();
      });
      post.dislikes.totalDislikes -= 1;
    }

    post.likes.totalLikes += 1;
    post.likes.likedBy.push(user);

    await post.save();
    res.status(200).json({ message: "Post liked successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postDislike = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const user = req.userId;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.dislikes.disLikedBy.includes(user)) {
      return res
        .status(400)
        .json({ message: "You have already disliked this post" });
    }
    // If the user has already liked the post, remove them from the likedBy array
    if (post.likes.likedBy.includes(user)) {
      post.likes.likedBy = post.likes.likedBy.filter((userId) => {
        return userId.toString() !== user.toString();
      });
      post.likes.totalLikes -= 1;
    }

    post.dislikes.totalDislikes += 1;
    post.dislikes.disLikedBy.push(user);
    await post.save();
    res.status(200).json({ message: "Post disliked successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.commentLike = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const user = req.userId;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.likes.likedBy.includes(user)) {
      return res
        .status(400)
        .json({ message: "You have already liked this comment" });
    }
    // If the user has already disliked the comment, remove them from the dislikedBy array
    if (comment.dislikes.disLikedBy.includes(user)) {
      comment.dislikes.disLikedBy = comment.dislikes.disLikedBy.filter(
        (userId) => {
          return userId.toString() !== user.toString();
        }
      );
      comment.dislikes.totalDislikes -= 1;
    }

    comment.likes.totalLikes += 1;
    comment.likes.likedBy.push(user);
    await comment.save();
    res.status(200).json({ message: "Comment liked successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.commentDislike = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const user = req.userId;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.dislikes.disLikedBy.includes(user)) {
      return res
        .status(400)
        .json({ message: "You have already Disliked this comment" });
    }
    // If the user has already disliked the comment, remove them from the dislikedBy array
    if (comment.likes.likedBy.includes(user)) {
      comment.likes.likedBy = comment.likes.likedBy.filter((userId) => {
        return userId.toString() !== user.toString();
      });
      comment.likes.totalLikes -= 1;
    }
    comment.dislikes.totalDislikes += 1;
    comment.dislikes.disLikedBy.push(user);
    await comment.save();
    res.status(200).json({ message: "Comment Disliked successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (post.author.toString() !== req.userId) {
      const error = new Error("Not authorized, you can not delete this blog!");
      error.statusCode = 403;
      throw error;
    }
    await Comment.deleteMany({ _id: post.comments });
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
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
