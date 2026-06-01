const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const { detectDisease, askLLM } = require('../services/ai.service');

// @desc    Create a new conversation
// @route   POST /api/chat/conversations
// @access  Private
const createConversation = async (req, res) => {
  const { title } = req.body;

  const conversation = await Conversation.create({
    user: req.user._id,
    title: title || 'New Conversation',
  });

  res.status(201).json({
    success: true,
    message: 'Conversation created successfully',
    data: conversation,
  });
};

// @desc    Get all conversations for the logged-in user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  const conversations = await Conversation.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations,
  });
};

// @desc    Get a single conversation with all its messages
// @route   GET /api/chat/conversations/:id
// @access  Private
const getConversation = async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
    });
  }

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      ...conversation,
      messages,
    },
  });
};

// @desc    Update conversation title
// @route   PATCH /api/chat/conversations/:id
// @access  Private
const updateConversation = async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    });
  }

  const conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title },
    { new: true, runValidators: true }
  );

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Conversation updated successfully',
    data: conversation,
  });
};

// @desc    Delete a conversation and all its messages
// @route   DELETE /api/chat/conversations/:id
// @access  Private
const deleteConversation = async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
    });
  }

  // Delete all messages in the conversation, then the conversation itself
  await Message.deleteMany({ conversation: conversation._id });
  await Conversation.deleteOne({ _id: conversation._id });

  res.status(200).json({
    success: true,
    message: 'Conversation deleted successfully',
  });
};

// @desc    Send a text message (LLM)
// @route   POST /api/chat/conversations/:id/text
// @access  Private
const sendTextMessage = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: 'Question is required',
    });
  }

  // Verify conversation belongs to user
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
    });
  }

  // Save the user message
  const userMessage = await Message.create({
    conversation: conversation._id,
    role: 'user',
    type: 'text',
    content: question,
  });

  // Build history from previous messages in this conversation
  const previousMessages = await Message.find({
    conversation: conversation._id,
    _id: { $ne: userMessage._id },
    type: 'text',
  })
    .sort({ createdAt: 1 })
    .lean();

  const history = previousMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Call the LLM
  let llmResponse;
  try {
    llmResponse = await askLLM(question, history);
  } catch (error) {
    // Save error as assistant message so user sees it
    const errorMessage = await Message.create({
      conversation: conversation._id,
      role: 'assistant',
      type: 'text',
      content: `Sorry, I couldn't process your question. Error: ${error.message}`,
      source: 'llm',
      metadata: { error: error.message },
    });

    return res.status(502).json({
      success: false,
      message: 'LLM service is currently unavailable',
      data: {
        userMessage,
        assistantMessage: errorMessage,
      },
    });
  }

  // Extract the answer from the LLM response
  const answerText =
    llmResponse.answer || llmResponse.response || JSON.stringify(llmResponse);

  // Save the assistant message
  const assistantMessage = await Message.create({
    conversation: conversation._id,
    role: 'assistant',
    type: 'text',
    content: answerText,
    source: 'llm',
    metadata: llmResponse,
  });

  // Auto-set title from first question if still default
  if (conversation.title === 'New Conversation') {
    conversation.title = question.substring(0, 100);
    await conversation.save();
  }

  res.status(200).json({
    success: true,
    data: {
      userMessage,
      assistantMessage,
    },
  });
};

// @desc    Send an image message (CNN)
// @route   POST /api/chat/conversations/:id/image
// @access  Private
const sendImageMessage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Image file is required',
    });
  }

  // Verify conversation belongs to user
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
    });
  }

  // Convert buffer to base64 data URI for storage
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  // Save the user message (image)
  const userMessage = await Message.create({
    conversation: conversation._id,
    role: 'user',
    type: 'image',
    imageUrl: base64Image,
  });

  // Call the CNN
  let cnnResponse;
  try {
    cnnResponse = await detectDisease(req.file.buffer, req.file.originalname);
  } catch (error) {
    const errorMessage = await Message.create({
      conversation: conversation._id,
      role: 'assistant',
      type: 'text',
      content: `Sorry, I couldn't analyze the image. Error: ${error.message}`,
      source: 'cnn',
      metadata: { error: error.message },
    });

    return res.status(502).json({
      success: false,
      message: 'CNN service is currently unavailable',
      data: {
        userMessage,
        assistantMessage: errorMessage,
      },
    });
  }

  // Build a human-readable answer from the CNN response
  let answerText = '';
  if (cnnResponse.diagnosis) {
    // Use the structured diagnosis from the API
    const d = cnnResponse.diagnosis;
    answerText = `🌿 Disease Detection Results:\n`;
    answerText += `**Disease:** ${d.disease}\n`;
    answerText += `**Confidence:** ${(d.confidence * 100).toFixed(1)}%\n`;
    answerText += `**Severity:** ${d.severity}\n`;
    answerText += `**Healthy:** ${d.is_healthy ? 'Yes' : 'No'}\n\n`;
    answerText += `📋 ${d.description}\n\n`;
    answerText += `💡 **Recommendation:** ${d.recommendation}`;
  } else if (cnnResponse.predictions && cnnResponse.predictions.length > 0) {
    const predictions = cnnResponse.predictions.map(
      (p) => `${p.display_name || p.class_name || 'Unknown'}: ${p.confidence_pct || ((p.confidence || 0) * 100).toFixed(1) + '%'}`
    );
    answerText = `🌿 Disease Detection Results:\n${predictions.join('\n')}`;
  } else {
    answerText = `🌿 Disease Detection Results:\n${JSON.stringify(cnnResponse)}`;
  }

  // Save the assistant message
  const assistantMessage = await Message.create({
    conversation: conversation._id,
    role: 'assistant',
    type: 'text',
    content: answerText,
    source: 'cnn',
    metadata: cnnResponse,
  });

  // Auto-set title if still default
  if (conversation.title === 'New Conversation') {
    conversation.title = 'Plant Disease Analysis';
    await conversation.save();
  }

  res.status(200).json({
    success: true,
    data: {
      userMessage,
      assistantMessage,
    },
  });
};

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  sendTextMessage,
  sendImageMessage,
};
