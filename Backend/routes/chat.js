const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getChatHistory } = require("../controllers/chat");

router.get("/:interestId", protect, getChatHistory);

module.exports = router;