const Interest = require("../models/interest");
const Listing = require("../models/listingSchema");
const Compatibility = require("../models/compatibility");
const User = require("../models/user");
const { notifyOwnerOfInterest, notifyTenantAccepted, notifyTenantDeclined } = require("../services/email");
// @POST /api/interests — tenant sends interest
const sendInterest = async (req, res) => {
  try {
    const { listingId, message } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });
    if (listing.isFilled) return res.status(400).json({ success: false, message: "Listing is already filled" });

    const existing = await Interest.findOne({ tenant: req.user._id, listing: listingId });
    if (existing) return res.status(400).json({ success: false, message: "Already expressed interest" });

    // Get compatibility score if exists
    const compat = await Compatibility.findOne({ tenant: req.user._id, listing: listingId });

    const interest = await Interest.create({
      tenant: req.user._id,
      listing: listingId,
      owner: listing.owner,
      message,
      compatibilityScore: compat?.score,
    });

    // Notify owner if score >= 80
    if (compat?.score >= 80) {
      const owner = await User.findById(listing.owner);
      await notifyOwnerOfInterest(owner, req.user, listing, compat.score);
    }

    res.status(201).json({ success: true, interest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/interests/:id — owner accepts/declines
const respondToInterest = async (req, res) => {
  try {
    const { status } = req.body; // "accepted" or "declined"
    const interest = await Interest.findOne({ _id: req.params.id, owner: req.user._id })
      .populate("tenant", "name email")
      .populate("listing", "title");

    if (!interest) return res.status(404).json({ success: false, message: "Interest not found" });

    interest.status = status;
    await interest.save();

    if (status === "accepted") {
      await notifyTenantAccepted(interest.tenant, interest.listing);
    } else if (status === "declined") {
      await notifyTenantDeclined(interest.tenant, interest.listing);
    }

    res.json({ success: true, interest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/interests/my — tenant's interests
const getMyInterests = async (req, res) => {
  try {
    const interests = await Interest.find({ tenant: req.user._id })
      .populate("listing", "title location rent")
      .populate("owner", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, interests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/interests/received — owner's received interests
const getReceivedInterests = async (req, res) => {
  try {
    const interests = await Interest.find({ owner: req.user._id })
      .populate("tenant", "name email")
      .populate("listing", "title location rent")
      .sort({ createdAt: -1 });
    res.json({ success: true, interests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendInterest, respondToInterest, getMyInterests, getReceivedInterests };