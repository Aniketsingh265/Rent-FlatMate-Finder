const Listing = require("../models/listingSchema");
const TenantProfile = require("../models/tenantProfile");
const { computeCompatibility } = require("../services/ai");
const { uploadImage } = require("../services/upload");

// @POST /api/listings — owner creates listing
const createListing = async (req, res) => {
  try {
    const data = { ...req.body, owner: req.user._id };
    if (typeof data.amenities === "string") data.amenities = JSON.parse(data.amenities);
    if (req.files?.length) {
      data.photos = await Promise.all(req.files.map((f) => uploadImage(f.buffer)));
    }
    const listing = await Listing.create(data);
    res.status(201).json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/listings — tenant browses (with AI scores)
const getListings = async (req, res) => {
  try {
    const { location, minBudget, maxBudget, furnished, roomType } = req.query;

    const filter = { isFilled: false };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (furnished !== undefined) filter.furnished = furnished === "true";
    if (roomType) filter.roomType = roomType;
    if (minBudget || maxBudget) {
      filter.rent = {};
      if (minBudget) filter.rent.$gte = Number(minBudget);
      if (maxBudget) filter.rent.$lte = Number(maxBudget);
    }

    let listings = await Listing.find(filter).populate("owner", "name email phone");

    // If tenant is logged in and has a profile, attach compatibility scores
    if (req.user?.role === "tenant") {
      const tenantProfile = await TenantProfile.findOne({ user: req.user._id });
      if (tenantProfile) {
        const scored = await Promise.all(
          listings.map(async (listing) => {
            const compat = await computeCompatibility(listing, tenantProfile);
            return { ...listing.toObject(), compatibilityScore: compat.score, compatibilityExplanation: compat.explanation };
          })
        );
        // Sort by compatibility score descending
        scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
        return res.json({ success: true, listings: scored });
      }
    }

    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/listings/:id
const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("owner", "name email phone");
    if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/listings/:id — owner updates
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!listing) return res.status(404).json({ success: false, message: "Listing not found or unauthorized" });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/listings/:id — owner deletes
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!listing) return res.status(404).json({ success: false, message: "Not found or unauthorized" });
    res.json({ success: true, message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/listings/:id/fill — mark as filled
const markFilled = async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isFilled: true },
      { new: true }
    );
    if (!listing) return res.status(404).json({ success: false, message: "Not found or unauthorized" });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/listings/my — owner's own listings
const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createListing, getListings, getListing, updateListing, deleteListing, markFilled, getMyListings };