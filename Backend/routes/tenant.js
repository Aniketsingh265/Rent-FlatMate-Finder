const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const { createOrUpdateProfile, getMyProfile } = require("../controllers/tenant");

router.post("/profile", protect, restrictTo("tenant"), createOrUpdateProfile);
router.get("/profile", protect, restrictTo("tenant"), getMyProfile);

module.exports = router;