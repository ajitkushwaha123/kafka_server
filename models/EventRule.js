import mongoose, { Schema } from "mongoose";

const ActionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    params: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
  { _id: false }
);

const ThrottleSchema = new Schema(
  {
    windowSec: { type: Number, default: 3600 }, // in one hour
    maxSends: { type: Number, default: 1 }, // only once per hour per user
  },
  { _id: false }
);

const ConditionSchema = new Schema(
  {
    // Minimal condition DSL (extend later): "metadata.path = /login && status = failure && metadata.httpStatus = 404"
    // We’ll store simple key/value equals and ranges for now
    equals: { type: Map, of: Schema.Types.Mixed, default: {} }, // { "metadata.httpStatus": 404 }
    contains: { type: Map, of: [Schema.Types.Mixed], default: {} },
    // You can extend with JSONLogic if desired
  },
  { _id: false }
);

const EventRuleSchema = new Schema(
  {
    name: { type: String, required: true },
    typeKey: { type: String, required: true, index: true }, 
    enabled: { type: Boolean, default: true },
    conditions: { type: ConditionSchema, default: {} },
    actions: { type: [ActionSchema], default: [] },
    throttle: { type: ThrottleSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

EventRuleSchema.index({ typeKey: 1, enabled: 1 });

export default mongoose.models.EventRule ||
  mongoose.model("EventRule", EventRuleSchema);
