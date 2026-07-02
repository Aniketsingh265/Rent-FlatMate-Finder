const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const User = require("../models/user");
const Listing = require("../models/listingSchema");
const Interest = require("../models/interest");


// @GET /api/admin/stats
router.get("/stats", protect, restrictTo("admin"), async (req, res) => {
  try {
    const [users, listings, interests] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Interest.countDocuments(),
    ]);
    res.json({ success: true, stats: { users, listings, interests } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/users
router.get("/users", protect, restrictTo("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/admin/users/:id
router.delete("/users/:id", protect, restrictTo("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/listings
router.get("/listings", protect, restrictTo("admin"), async (req, res) => {
  try {
    const listings = await Listing.find().populate("owner", "name email").sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/admin/listings/:id
router.delete("/listings/:id", protect, restrictTo("admin"), async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;