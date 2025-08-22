import mongoose, { Schema } from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, index: { unique: true, sparse: true } },
    typeKey: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ["system", "auth", "billing", "validation", "support", "query"],
      required: true,
      index: true,
    },

    userId: { type: String, index: true, default: null },
    sessionId: { type: String, index: true, default: null },
    anonymousId: { type: String, index: true, default: null },
    tenantId: { type: String, index: true, default: null },

    source: {
      type: String,
      enum: ["frontend", "backend", "worker", "webhook"],
      default: "backend",
      index: true,
    },
    status: {
      type: String,
      enum: ["success", "failure", "info", "warn", "error"],
      default: "info",
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
      index: true,
    },

    metadata: { type: Schema.Types.Mixed, default: {} },
    context: {
      ip: String,
      ua: String,
      url: String,
      referrer: String,
      device: String,
      os: String,
      browser: String,
    },

    occurredAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

EventSchema.index({ typeKey: 1, occurredAt: -1 });
EventSchema.index({ userId: 1, occurredAt: -1 });
EventSchema.index({ tenantId: 1, occurredAt: -1 });
EventSchema.index({ status: 1, occurredAt: -1 });

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
