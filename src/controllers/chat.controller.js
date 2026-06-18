const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const { detectDisease, askLLM } = require('../services/ai.service');
const DiseaseScan = require('../models/disease-scan.model');
const User = require('../models/user.model');

// ---- Localized defaults / constants ----
const DEFAULT_CONVERSATION_TITLE = 'محادثة جديدة';
const IMAGE_SCAN_TITLE = 'فحص  صوره جديده ';
const IMAGE_PLACEHOLDER = '[صورة مرفوعة من قبل المستخدم]';

// Strict instruction appended to every prompt sent to the LLM to force Arabic-only output
const ARABIC_ONLY_INSTRUCTION =
  '\n\nIMPORTANT: You MUST write your entire response in Arabic language only. Do not use English or any other language in your reply.';

const withArabicEnforcement = (prompt) => `${prompt}${ARABIC_ONLY_INSTRUCTION}`;

/**
 * Builds the [{question, answer}] history array expected by askLLM from a list
 * of previous Message documents. Handles BOTH text and image messages so the
 * conversation doesn't lose context when a user uploads an image mid-chat.
 * Image-only user messages (no text content) are replaced with a placeholder.
 */
const buildHistory = (previousMessages) => {
  const history = [];
  let tempPair = {};

  previousMessages.forEach((msg) => {
    // Skip messages that represent a previous failure so the model isn't
    // confused by stale error text sitting in its own history.
    const isKnownErrorMessage =
      (msg.content && msg.content.includes("Sorry, I couldn't process")) ||
      (msg.content && msg.content.includes('عذراً، لم أتمكن من تحليل الصورة')) ||
      (msg.metadata && msg.metadata.error);

    if (isKnownErrorMessage) {
      return;
    }

    // Resolve a textual stand-in for this message, even if it's an image
    let displayContent = msg.content;
    if ((!displayContent || displayContent.trim() === '') && msg.type === 'image') {
      displayContent = IMAGE_PLACEHOLDER;
    }

    if (!displayContent) {
      return;
    }

    if (msg.role === 'user') {
      tempPair.question = displayContent;
    } else if (msg.role === 'assistant' && tempPair.question) {
      tempPair.answer = displayContent;
      history.push({ ...tempPair });
      tempPair = {};
    }
  });

  return history;
};

// @desc    Create a new conversation
// @route   POST /api/chat/conversations
// @access  Private
const createConversation = async (req, res) => {
  const { title } = req.body;

  const conversation = await Conversation.create({
    user: req.user._id,
    title: title || DEFAULT_CONVERSATION_TITLE,
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

  // Build history from ALL previous messages (text + image) so the context
  // doesn't break if the user uploaded an image earlier in the conversation.
  const previousMessages = await Message.find({
    conversation: conversation._id,
    _id: { $ne: userMessage._id },
  })
    .sort({ createdAt: 1 })
    .lean();

  const history = buildHistory(previousMessages);

  // Call the LLM
  let llmResponse;
  try {
    llmResponse = await askLLM(withArabicEnforcement(question), history);
  } catch (error) {
    // We deliberately do NOT save an error message to the database here —
    // we just return a temporary one to the frontend.
    return res.status(502).json({
      success: false,
      message: 'LLM service is currently unavailable',
      data: {
        userMessage,
        assistantMessage: {
          _id: 'temp_error_id',
          conversation: conversation._id,
          role: 'assistant',
          type: 'text',
          content: 'عذراً، حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
          isError: true,
        },
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
  if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
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

// @desc    Send an image message (CNN diagnosis explained by the LLM)
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

  // Step 1: Call the CNN model
  let cnnResponse;
  try {
    cnnResponse = await detectDisease(req.file.buffer, req.file.originalname);
  } catch (error) {
    const errorMessage = await Message.create({
      conversation: conversation._id,
      role: 'assistant',
      type: 'text',
      content: `عذراً، لم أتمكن من تحليل الصورة. حدث خطأ: ${error.message}`,
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

  const user = await User.findById(req.user._id);

  let diseaseName = 'Unknown';
  let confidence = 0;
  let severity = 'Unknown';
  let isHealthy = false;

  if (cnnResponse.diagnosis) {
    diseaseName = cnnResponse.diagnosis.disease;
    confidence = cnnResponse.diagnosis.confidence * 100;
    severity = cnnResponse.diagnosis.severity;
    isHealthy = cnnResponse.diagnosis.is_healthy;
  } else if (cnnResponse.predictions && cnnResponse.predictions.length > 0) {
    diseaseName =
      cnnResponse.predictions[0].display_name || cnnResponse.predictions[0].class_name;
    confidence =
      cnnResponse.predictions[0].confidence_pct || cnnResponse.predictions[0].confidence;
  }

  await DiseaseScan.create({
    user: req.user._id,
    governorate: user.governorate,
    imageUrl: base64Image,
    diseaseName,
    confidence,
    severity,
    isHealthy,
  });

  // Step 2: Build a hidden prompt carrying the CNN results. This is never
  // shown to the user directly — it's handed to the LLM so it can turn the
  // raw diagnosis into a natural, human explanation.
  const confidenceDisplay = typeof confidence === 'number' ? confidence.toFixed(1) : confidence;

  const hiddenCnnPrompt = `
لقد قام نظام الذكاء الاصطناعي (CNN) بتحليل صورة نبات رفعها المستخدم، وكانت نتيجة التحليل كالتالي:
- المرض المكتشف: ${diseaseName}
- نسبة الثقة في التشخيص: ${confidenceDisplay}%
- درجة الخطورة: ${severity}
- هل النبات سليم: ${isHealthy ? 'نعم' : 'لا'}
${cnnResponse.diagnosis && cnnResponse.diagnosis.description ? `- وصف إضافي من النظام: ${cnnResponse.diagnosis.description}` : ''}
${cnnResponse.diagnosis && cnnResponse.diagnosis.recommendation ? `- توصية النظام: ${cnnResponse.diagnosis.recommendation}` : ''}

المطلوب منك: صغ هذه النتيجة في رسالة طبيعية وودودة موجهة للمستخدم، اشرح له التشخيص ببساطة، وقدم نصائح عملية للتعامل مع الحالة (أو طمئنه إذا كان النبات سليماً). لا تذكر أنك تستلم هذه البيانات من نظام تحليل صور، وتحدث معه مباشرة كخبير زراعي ودود.
  `.trim();

  // Fetch ALL previous messages (text + image) so the LLM keeps full context
  const previousMessages = await Message.find({
    conversation: conversation._id,
    _id: { $ne: userMessage._id },
  })
    .sort({ createdAt: 1 })
    .lean();

  const history = buildHistory(previousMessages);

  // Pre-built Arabic fallback text, used only if the LLM call below fails.
  // The CNN diagnosis is still valid even without the LLM's natural phrasing.
  const buildManualFallbackText = () => {
    if (cnnResponse.diagnosis) {
      const d = cnnResponse.diagnosis;
      let text = `🌿 نتائج تحليل المرض:\n`;
      text += `**المرض:** ${d.disease}\n`;
      text += `**نسبة الثقة:** ${(d.confidence * 100).toFixed(1)}%\n`;
      text += `**درجة الخطورة:** ${d.severity}\n`;
      text += `**سليم:** ${d.is_healthy ? 'نعم' : 'لا'}\n\n`;
      if (d.description) text += `📋 ${d.description}\n\n`;
      if (d.recommendation) text += `💡 **التوصية:** ${d.recommendation}`;
      return text;
    }

    if (cnnResponse.predictions && cnnResponse.predictions.length > 0) {
      const predictions = cnnResponse.predictions.map(
        (p) =>
          `${p.display_name || p.class_name || 'غير معروف'}: ${
            p.confidence_pct || ((p.confidence || 0) * 100).toFixed(1) + '%'
          }`
      );
      return `🌿 نتائج تحليل المرض:\n${predictions.join('\n')}`;
    }

    return `🌿 نتائج تحليل المرض:\n${JSON.stringify(cnnResponse)}`;
  };

  // Step 3: Ask the LLM to turn the raw diagnosis into a natural explanation
  let assistantMessage;
  try {
    const llmResponse = await askLLM(withArabicEnforcement(hiddenCnnPrompt), history);
    const answerText =
      llmResponse.answer || llmResponse.response || JSON.stringify(llmResponse);

    assistantMessage = await Message.create({
      conversation: conversation._id,
      role: 'assistant',
      type: 'text',
      content: answerText,
      source: 'llm',
      metadata: { cnn: cnnResponse, llm: llmResponse },
    });
  } catch (error) {
    // LLM phrasing failed, but the CNN diagnosis itself is still valid —
    // fall back to a manually formatted Arabic message instead of failing.
    assistantMessage = await Message.create({
      conversation: conversation._id,
      role: 'assistant',
      type: 'text',
      content: buildManualFallbackText(),
      source: 'cnn',
      metadata: { cnn: cnnResponse, llmError: error.message },
    });
  }

  // Auto-set title if still default
  if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
    conversation.title = IMAGE_SCAN_TITLE;
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