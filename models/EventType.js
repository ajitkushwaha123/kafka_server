import mongoose from "mongoose";

const EventTypeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["system", "auth", "billing", "validation", "support", "query"],
      required: true,
    },
    description: { type: String, default: "" },

    // The improved schema object
    schema: {
      // Define the expected fields for the metadata object of this event type
      type: mongoose.Schema.Types.Mixed,
      default: {},
      required: true,
    },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const EventType =
  mongoose.models.EventType || mongoose.model("EventType", EventTypeSchema);

export default EventType;
