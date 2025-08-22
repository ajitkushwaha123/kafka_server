import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: true,
    },

    credits: {
      type: Number,
      default: 10,
    },

    isAdmin: { type: Boolean, default: false },

    subscription: {
      isActive: { type: Boolean, default: false },
      expiresAt: { type: Date },
      plan: { type: String, default: "free" },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
    },

    searchHistory: [
      {
        query: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    totalSearches: { type: Number, default: 0 },
    totalImagesDownloaded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
