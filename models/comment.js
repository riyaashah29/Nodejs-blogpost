const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentsSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: {
      totalLikes: {
        type: Number,
        default: 0,
      },
      likedBy: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    dislikes: {
      totalDislikes: {
        type: Number,
        default: 0,
      },
      disLikedBy: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentsSchema);
