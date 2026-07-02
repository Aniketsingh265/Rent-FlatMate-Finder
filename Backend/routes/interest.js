const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const { sendInterest, respondToInterest, getMyInterests, getReceivedInterests } = require("../controllers/interest");


router.post("/", protect, restrictTo("tenant"), sendInterest);
router.patch("/:id", protect, restrictTo("owner"), respondToInterest);
router.get("/my", protect, restrictTo("tenant"), getMyInterests);
router.get("/received", protect, restrictTo("owner"), getReceivedInterests);

module.exports = router;