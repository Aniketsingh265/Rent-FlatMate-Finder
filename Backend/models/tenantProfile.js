const mongoose = require("mongoose");

const tenantProfileSchema = new mongoose.Schema(
  {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        unique: true },
    preferredLocation: { 
        type: String, 
        required: true },
    budgetMin: { 
        type: Number, 
        required: true },
    budgetMax: { 
        type: Number, 
        required: true },
    moveInDate: { 
        type: Date, 
        required: true },
    preferences: {
      furnished: { 
        type: Boolean, 
        default: false },
      roomType: {
        type: String,
        enum: ["single", "shared", "any"],
        default: "any",
      },
      gender: {
        type: String,
        enum: ["male", "female", "any"],
        default: "any",
      },
    },
    bio: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TenantProfile", tenantProfileSchema);