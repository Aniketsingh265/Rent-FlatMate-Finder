import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getListing, sendInterest } from "../services/api";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import "./ListingDetailPage.css";

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getListing(id)
      .then((res) => setListing(res.data.listing))
      .catch(() => toast.error("Listing not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInterest = async () => {
    setSending(true);
    try {
      await sendInterest({ listingId: id, message });
      toast.success("Interest sent!");
      navigate("/interests");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send interest");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="detail-loading">Loading...</div>;
  if (!listing) return <div className="detail-loading">Listing not found.</div>;

  return (
    <div className="detail-container">
      <div className="detail-card">
        <div className="detail-header">
          <div className="detail-badges">
            <span className={`badge ${listing.roomType}`}>{listing.roomType}</span>
            {listing.furnished && <span className="badge furnished">Furnished</span>}
            {listing.gender !== "any" && <span className="badge gender">{listing.gender} only</span>}
          </div>
          <h1>{listing.title}</h1>
          <p className="detail-location">📍 {listing.location}</p>
          <p className="detail-rent">₹{listing.rent.toLocaleString()}<span>/month</span></p>
        </div>

        {listing.photos?.length > 0 && (
          <div className="detail-photos">
            {listing.photos.map((url, i) => (
              <img key={i} src={url} alt={`${listing.title} photo ${i + 1}`} />
            ))}
          </div>
        )}

        <div className="detail-grid">
          <div className="detail-info">
            <h2>Details</h2>
            <div className="info-row"><span>Available From</span><strong>{new Date(listing.availableFrom).toLocaleDateString()}</strong></div>
            <div className="info-row"><span>Room Type</span><strong>{listing.roomType}</strong></div>
            <div className="info-row"><span>Furnished</span><strong>{listing.furnished ? "Yes" : "No"}</strong></div>
            <div className="info-row"><span>Gender Preference</span><strong>{listing.gender}</strong></div>
            {listing.description && (
              <div className="detail-description">
                <h3>Description</h3>
                <p>{listing.description}</p>
              </div>
            )}
            {listing.amenities?.length > 0 && (
              <div className="detail-amenities">
                <h3>Amenities</h3>
                <div className="amenities-list">
                  {listing.amenities.map((a, i) => <span key={i} className="amenity-tag">{a}</span>)}
                </div>
              </div>
            )}
          </div>

          <div className="detail-owner-card">
            <h2>Owner</h2>
            <p className="owner-name">👤 {listing.owner?.name}</p>
            <p className="owner-email">✉️ {listing.owner?.email}</p>

            {user?.role === "tenant" && !listing.isFilled && (
              <div className="interest-form">
                <h3>Express Interest</h3>
                <textarea
                  placeholder="Add a message (optional)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
                <button className="btn-interest" onClick={handleInterest} disabled={sending}>
                  {sending ? "Sending..." : "Send Interest"}
                </button>
              </div>
            )}
            {listing.isFilled && <div className="filled-badge">This listing is filled</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
