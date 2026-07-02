import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getListings } from "../services/api";
import toast from "react-hot-toast";
import "./ListingsPage.css";

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: "", minBudget: "", maxBudget: "", roomType: "" });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await getListings(filters);
      setListings(res.data.listings);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  return (
    <div className="listings-container">
      <div className="listings-hero">
        <h1>Find Your Perfect Home</h1>
        <p>Browse listings matched to your preferences</p>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Location..."
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <input
          type="number"
          placeholder="Min Budget"
          value={filters.minBudget}
          onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max Budget"
          value={filters.maxBudget}
          onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
        />
        <select value={filters.roomType} onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}>
          <option value="">Any Room Type</option>
          <option value="single">Single</option>
          <option value="shared">Shared</option>
        </select>
        <button className="btn-search" onClick={fetchListings}>Search</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="empty-state">No listings found. Try different filters.</div>
      ) : (
        <div className="listings-grid">
          {listings.map((listing) => (
            <Link to={`/listings/${listing._id}`} key={listing._id} className="listing-card">
              {listing.photos?.[0] && (
                <img src={listing.photos[0]} alt={listing.title} className="listing-card-photo" />
              )}
              <div className="listing-card-header">
                <span className={`badge ${listing.roomType}`}>{listing.roomType}</span>
                {listing.furnished && <span className="badge furnished">Furnished</span>}
              </div>
              <h3>{listing.title}</h3>
              <p className="listing-location">📍 {listing.location}</p>
              <p className="listing-rent">₹{listing.rent.toLocaleString()}/month</p>
              {listing.compatibilityScore !== undefined && (
                <div className="compat-score">
                  <div className="compat-bar">
                    <div className="compat-fill" style={{ width: `${listing.compatibilityScore}%` }} />
                  </div>
                  <span>{listing.compatibilityScore}% Match</span>
                </div>
              )}
              <p className="listing-owner">By {listing.owner?.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
