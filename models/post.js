const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
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
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

// postSchema.virtual("isVisible").get(function () {
//   return this.dislikes.totalDislikes < 2;
// });

module.exports = mongoose.model("Post", postSchema);
