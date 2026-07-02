const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
  createListing, getListings, getListing,
  updateListing, deleteListing, markFilled, getMyListings
} = require("../controllers/listing");

router.get("/", protect, getListings);
router.get("/my", protect, restrictTo("owner"), getMyListings);
router.get("/:id", protect, getListing);
router.post("/", protect, restrictTo("owner"), upload.array("photos", 5), createListing);
router.put("/:id", protect, restrictTo("owner"), updateListing);
router.delete("/:id", protect, restrictTo("owner"), deleteListing);
router.patch("/:id/fill", protect, restrictTo("owner"), markFilled);

module.exports = router;