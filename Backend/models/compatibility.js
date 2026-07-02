const mongoose = require("mongoose");

const compatibilitySchema = new mongoose.Schema(
  {
    tenant: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true },
    listing: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Listing", 
        required: true },
    score: { 
        type: Number, 
        min: 0, 
        max: 100, 
        required: true },
    explanation: { 
        type: String, 
        required: true },
    scoredBy: {
      type: String,
      enum: ["llm", "rule-based"],
      default: "llm",
    },
  },
  { timestamps: true }
);

// Unique pair per tenant-listing
compatibilitySchema.index({ tenant: 1, listing: 1 }, { unique: true });

module.exports = mongoose.model("Compatibility", compatibilitySchema);