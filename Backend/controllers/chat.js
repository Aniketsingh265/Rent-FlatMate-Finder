const Message = require("../models/message");
const Interest = require("../models/interest");


// @GET /api/chat/:interestId — get chat history
const getChatHistory = async (req, res) => {
  try {
    const { interestId } = req.params;

    // Verify user is part of this conversation
    const interest = await Interest.findById(interestId);
    if (!interest) return res.status(404).json({ success: false, message: "Chat not found" });

    const isParticipant =
      interest.tenant.toString() === req.user._id.toString() ||
      interest.owner.toString() === req.user._id.toString();

    if (!isParticipant) return res.status(403).json({ success: false, message: "Access denied" });

    if (interest.status !== "accepted") {
      return res.status(403).json({ success: false, message: "Chat only available after interest is accepted" });
    }

    const messages = await Message.find({ interest: interestId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getChatHistory };