const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true },
    title: { 
        type: String, 
        required: true },
    location: { 
        type: String, 
        required: true },
    rent: { 
        type: Number, 
        required: true },
    availableFrom: { 
        type: Date, 
        required: true },
    roomType: {
      type: String,
      enum: ["single", "shared"],
      required: true,
    },
    furnished: { 
        type: Boolean, 
        default: false },
    photos: [{ 
        type: String }],
    description: { 
        type: String, 
        maxlength: 1000 },
    amenities: [{ 
        type: String }],
    isFilled: { 
        type: Boolean, 
        default: false },
    gender: {
      type: String,
      enum: ["male", "female", "any"],
      default: "any",
    },
  },
  { timestamps: true }
);

// Index for search
listingSchema.index({ location: "text", title: "text" });

module.exports = mongoose.model("Listing", listingSchema);