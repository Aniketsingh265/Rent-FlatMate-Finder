const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema(
  {
    tenant: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true },
    listing: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Listing", 
        required: true },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    compatibilityScore: { 
        type: Number },
    message: { 
        type: String, 
        maxlength: 500 },
  },
  { timestamps: true }
);

// One interest request per tenant per listing
interestSchema.index({ tenant: 1, listing: 1 }, { unique: true });

module.exports = mongoose.model("Interest", interestSchema);