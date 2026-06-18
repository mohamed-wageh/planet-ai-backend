const Post = require('../models/post.model');
const Comment = require('../models/comment.model');


exports.createPost = async (req, res) => {
  const { content } = req.body;
  
  let mediaBase64 = null;

  if (req.file) {
    mediaBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  const newPost = await Post.create({
    author: req.user._id,
    content,
    media: mediaBase64,
  });

  res.status(201).json({ success: true, data: newPost });
};

exports.getPosts = async (req, res) => {
  const posts = await Post.find()
    .populate('author', 'username role governorate')
    .sort('-createdAt');
    
  res.status(200).json({ success: true, count: posts.length, data: posts });
};

exports.togglePostUpvote = async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
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
};


exports.addComment = async (req, res) => {
  const { content } = req.body;
  
  const comment = await Comment.create({
    post: req.params.postId,
    author: req.user._id,
    content,
  });

  res.status(201).json({ success: true, data: comment });
};

exports.getPostComments = async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate('author', 'username role')
    .lean();

  comments.sort((a, b) => {
    if (a.author.role === 'DOCTOR' && b.author.role !== 'DOCTOR') return -1;
    if (a.author.role !== 'DOCTOR' && b.author.role === 'DOCTOR') return 1;

    const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
    const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);

    return scoreB - scoreA;
  });

  res.status(200).json({ success: true, count: comments.length, data: comments });
};

exports.voteComment = async (req, res) => {
  const { voteType } = req.body; 
  const userId = req.user._id;

  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  comment.upvotes.pull(userId);
  comment.downvotes.pull(userId);

  if (voteType === 'upvote') {
    comment.upvotes.push(userId);
  } else if (voteType === 'downvote') {
    comment.downvotes.push(userId);
  }

  await comment.save();

  const currentScore = comment.upvotes.length - comment.downvotes.length;
  res.status(200).json({ success: true, score: currentScore });
};
exports.getPostsByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const posts = await Post.find({ author: userId })
            .sort('-createdAt') 
            .populate('author', 'username role governorate');

        res.status(200).json({
            success: true,
            count: posts.length,
            data: posts
        });
    } catch (error) {
        next(error);
    }
};