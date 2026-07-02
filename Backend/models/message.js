const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    interest: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Interest", 
        required: true },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true },
    content: { 
        type: String, 
        required: true, 
        maxlength: 2000 },
    readBy: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);