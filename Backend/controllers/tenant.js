const TenantProfile = require("../models/tenantProfile");

// @POST /api/tenants/profile
const createOrUpdateProfile = async (req, res) => {
  try {
    const profile = await TenantProfile.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body, user: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/tenants/profile
const getMyProfile = async (req, res) => {
  try {
    const profile = await TenantProfile.findOne({ user: req.user._id });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createOrUpdateProfile, getMyProfile };