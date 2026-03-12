import { Schema, model, models, Document } from "mongoose";

const TakeoffItemSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["polygon", "line", "point"], required: true },
    area: Number,
    length: Number,
    unit: { type: String, default: "sq ft" },
    geometry: Schema.Types.Mixed,
    color: String,
  },
  { _id: false }
);

export interface IRequest extends Document {
  title: string;
  description: string;
  category: string;
  takeoffIndustry?: string;
  priority: string;
  status: string;
  geometry: object;
  takeoffItems?: Array<{
    id: string;
    label: string;
    type: string;
    area?: number;
    length?: number;
    unit: string;
    geometry?: object;
    color?: string;
  }>;
  clientId?: Schema.Types.ObjectId;
  clientName: string;
  clientEmail: string;
  propertyAddress: string;
  propertySize?: string | number;
  propertyFeatures: string[];
  assignedTo?: Schema.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  estimatedCompletion?: string;
  shareToken?: string | null;
  qaFeedback?: string;
  qaComments?: Array<{ id: string; text: string; position?: [number, number]; createdAt: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "landscape-measurement",
        "property-assessment",
        "maintenance-request",
        "consultation",
        "paving",
        "snow-removal",
        "irrigation",
        "hardscape",
        "other",
      ],
      required: true,
    },
    takeoffIndustry: {
      type: String,
      enum: ["landscaping", "paving", "snow-removal", "irrigation", "hardscape", "facilities"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "pending-qa", "qa-approved", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    geometry: { type: Schema.Types.Mixed, required: true },
    takeoffItems: [TakeoffItemSchema],
    clientId: { type: Schema.Types.ObjectId, ref: "User" },
    clientName: { type: String, required: true },
    clientEmail: { type: String, default: "" },
    propertyAddress: { type: String, default: "" },
    propertySize: Schema.Types.Mixed,
    propertyFeatures: { type: [String], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    notes: String,
    attachments: [String],
    estimatedCompletion: String,
    shareToken: { type: String, default: null },
    qaFeedback: String,
    qaComments: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

RequestSchema.index({ clientId: 1, status: 1 });
RequestSchema.index({ createdAt: -1 });
RequestSchema.index({ shareToken: 1 }, { sparse: true });

const Request = models.Request || model<IRequest>("Request", RequestSchema);
export default Request;
