const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Message must belong to a conversation'],
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: [true, 'Message must have a role'],
    },
    type: {
      type: String,
      enum: ['text', 'image'],
      required: [true, 'Message must have a type'],
    },
    content: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    source: {
      type: String,
      enum: ['cnn', 'llm'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
