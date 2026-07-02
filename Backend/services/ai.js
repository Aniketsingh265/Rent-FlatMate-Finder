const OpenAI = require("openai");
const Compatibility = require("../models/compatibility");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rule-based fallback scorer
const ruleBasedScore = (listing, tenantProfile) => {
  let score = 0;
  let reasons = [];

  // Budget match (40 points)
  if (listing.rent >= tenantProfile.budgetMin && listing.rent <= tenantProfile.budgetMax) {
    score += 40;
    reasons.push("Rent is within budget range.");
  } else if (listing.rent < tenantProfile.budgetMin) {
    score += 25;
    reasons.push("Rent is below budget (could be a good deal).");
  } else {
    const overBy = ((listing.rent - tenantProfile.budgetMax) / tenantProfile.budgetMax) * 100;
    if (overBy <= 10) { score += 20; reasons.push("Rent is slightly above budget."); }
    else if (overBy <= 25) { score += 10; reasons.push("Rent is moderately above budget."); }
    else reasons.push("Rent is significantly above budget.");
  }

  // Location match (40 points)
  const listingLoc = listing.location.toLowerCase();
  const prefLoc = tenantProfile.preferredLocation.toLowerCase();
  if (listingLoc.includes(prefLoc) || prefLoc.includes(listingLoc)) {
    score += 40;
    reasons.push("Location matches preferred area.");
  } else {
    reasons.push("Location does not match preferred area.");
  }

  // Furnished preference (10 points)
  if (tenantProfile.preferences?.furnished !== null &&
      tenantProfile.preferences?.furnished === listing.furnished) {
    score += 10;
    reasons.push("Furnished preference matches.");
  }

  // Room type (10 points)
  if (tenantProfile.preferences?.roomType === "any" ||
      tenantProfile.preferences?.roomType === listing.roomType) {
    score += 10;
    reasons.push("Room type matches preference.");
  }

  return {
    score: Math.min(score, 100),
    explanation: reasons.join(" "),
    scoredBy: "rule-based",
  };
};

// Main scoring function — tries LLM first, falls back to rule-based
const computeCompatibility = async (listing, tenantProfile) => {
  // Check if already computed
  const existing = await Compatibility.findOne({
    tenant: tenantProfile.user,
    listing: listing._id,
  });
  if (existing) return existing;

  let result;

  try {
    const prompt = `Given this room listing: ${JSON.stringify({
      location: listing.location,
      rent: listing.rent,
      roomType: listing.roomType,
      furnished: listing.furnished,
      availableFrom: listing.availableFrom,
    })} and this tenant profile: ${JSON.stringify({
      preferredLocation: tenantProfile.preferredLocation,
      budgetMin: tenantProfile.budgetMin,
      budgetMax: tenantProfile.budgetMax,
      moveInDate: tenantProfile.moveInDate,
      preferences: tenantProfile.preferences,
    })}, compute a compatibility score from 0 to 100 based on budget and location match. Return JSON only: { "score": number, "explanation": string }`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0].message.content;
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    result = {
      score: Math.min(Math.max(parsed.score, 0), 100),
      explanation: parsed.explanation,
      scoredBy: "llm",
    };
  } catch (err) {
    console.warn("LLM scoring failed, using rule-based fallback:", err.message);
    result = ruleBasedScore(listing, tenantProfile);
  }

  // Save to DB
  const compatibility = await Compatibility.create({
    tenant: tenantProfile.user,
    listing: listing._id,
    score: result.score,
    explanation: result.explanation,
    scoredBy: result.scoredBy,
  });

  return compatibility;
};

module.exports = { computeCompatibility };
