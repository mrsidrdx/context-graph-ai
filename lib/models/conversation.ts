import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextUsed?: {
    documentCount: number;
    topicCount: number;
    projectCount: number;
  };
  contextGraph?: any; // Store the full context graph for assistant messages
  enrichedContext?: {
    keyInsights: string[];
    missingInformation: string[];
    recommendedDepth: 1 | 2 | 3;
    relevantNodes: any[];
  };
}

export interface IConversation extends Document {
  conversationId: string;
  userId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  contextUsed: {
    documentCount: { type: Number },
    topicCount: { type: Number },
    projectCount: { type: Number },
  },
  contextGraph: { type: Schema.Types.Mixed },
  enrichedContext: {
    keyInsights: [{ type: String }],
    missingInformation: [{ type: String }],
    recommendedDepth: { type: Number, enum: [1, 2, 3] },
    relevantNodes: [{ type: Schema.Types.Mixed }],
  },
});

const ConversationSchema = new Schema<IConversation>(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
