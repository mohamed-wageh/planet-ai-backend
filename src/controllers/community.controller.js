const Post = require("../models/post.model");
const Comment = require("../models/comment.model");
const User = require("../models/user.model");

exports.createPost = async (req, res, next) => {
  try {
    const { content } = req.body;

    let mediaBase64 = null;
    if (req.file) {
      mediaBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const newPost = await Post.create({
      author: req.user._id,
      content,
      media: mediaBase64,
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this post",
        });
    }

    await Post.findByIdAndDelete(req.params.postId);
    await Comment.deleteMany({ post: req.params.postId });

    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate("author", "username role governorate")
      .sort("-createdAt")
      .lean();

    // Get comment counts for each post
    const postIds = posts.map(p => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    commentCounts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });

    const postsWithCounts = posts.map(p => ({
      ...p,
      commentCount: countMap[p._id.toString()] || 0
    }));

    res.status(200).json({ success: true, count: postsWithCounts.length, data: postsWithCounts });
  } catch (error) {
    next(error);
  }
};

exports.togglePostUpvote = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const userId = req.user._id;
    const hasUpvoted = post.upvotes.includes(userId);

    if (hasUpvoted) {
      post.upvotes.pull(userId);
    } else {
      post.upvotes.push(userId);
    }

    await post.save();
    res.status(200).json({ success: true, upvotesCount: post.upvotes.length });
  } catch (error) {
    next(error);
  }
};

exports.toggleSavePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hasSaved = user.savedPosts && user.savedPosts.includes(post._id);

    if (hasSaved) {
      user.savedPosts.pull(post._id);
    } else {
      if (!user.savedPosts) user.savedPosts = [];
      user.savedPosts.push(post._id);
    }

    await user.save();
    res.status(200).json({ success: true, savedPosts: user.savedPosts });
  } catch (error) {
    next(error);
  }
};

exports.getSavedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user.savedPosts || [] });
  } catch (error) {
    next(error);
  }
};

exports.getCommunityStats = async (req, res, next) => {
  try {
    const membersCount = await User.countDocuments();
    const postsCount = await Post.countDocuments();
    res.status(200).json({ success: true, data: { membersCount, postsCount } });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user._id,
      content,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

exports.getPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "username role")
      .lean();

    comments.sort((a, b) => {
      if (a.author.role === "DOCTOR" && b.author.role !== "DOCTOR") return -1;
      if (a.author.role !== "DOCTOR" && b.author.role === "DOCTOR") return 1;

      const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
      const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);

      return scoreB - scoreA;
    });

    res
      .status(200)
      .json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    next(error);
  }
};

exports.voteComment = async (req, res, next) => {
  try {
    const { voteType } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    comment.upvotes.pull(userId);
    comment.downvotes.pull(userId);

    if (voteType === "upvote") {
      comment.upvotes.push(userId);
    } else if (voteType === "downvote") {
      comment.downvotes.push(userId);
    }

    await comment.save();

    const currentScore = comment.upvotes.length - comment.downvotes.length;
    res.status(200).json({ success: true, score: currentScore });
  } catch (error) {
    next(error);
  }
};

exports.getPostsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ author: userId })
      .sort("-createdAt")
      .populate("author", "username role governorate");

    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    next(error);
  }
};
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this comment",
        });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};