import { useState, useEffect } from "react";
import { getMyListings, createListing, deleteListing, markListingFilled } from "../services/api";
import toast from "react-hot-toast";
import "./OwnerDashboard.css";

const emptyForm = {
  title: "", location: "", rent: "", availableFrom: "",
  roomType: "single", furnished: false, description: "", gender: "any", amenities: "",
};

export default function OwnerDashboard() {
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = () => {
    getMyListings().then((res) => setListings(res.data.listings)).catch(() => {});
  };

  useEffect(() => { fetchListings(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amenities = form.amenities ? form.amenities.split(",").map(a => a.trim()) : [];
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, key === "amenities" ? JSON.stringify(amenities) : value);
      });
      photos.forEach((file) => data.append("photos", file));

      await createListing(data);
      toast.success("Listing created!");
      setForm(emptyForm);
      setPhotos([]);
      setShowForm(false);
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await deleteListing(id);
      toast.success("Deleted");
      fetchListings();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleFill = async (id) => {
    try {
      await markListingFilled(id);
      toast.success("Marked as filled");
      fetchListings();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Owner Dashboard</h1>
          <p>Manage your listings</p>
        </div>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Listing"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="listing-form">
          <h2>New Listing</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input placeholder="Cozy 1BHK in Bandra" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input placeholder="Bandra, Mumbai" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rent (₹/month)</label>
              <input type="number" placeholder="12000" value={form.rent}
                onChange={(e) => setForm({ ...form, rent: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Available From</label>
              <input type="date" value={form.availableFrom}
                onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Room Type</label>
              <select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
                <option value="single">Single</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            <div className="form-group">
              <label>Gender Preference</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="Describe your property..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Amenities (comma separated)</label>
            <input placeholder="WiFi, AC, Parking" value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Photos (up to 5)</label>
            <input type="file" accept="image/*" multiple
              onChange={(e) => setPhotos([...e.target.files].slice(0, 5))} />
          </div>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.furnished}
              onChange={(e) => setForm({ ...form, furnished: e.target.checked })} />
            Furnished
          </label>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Creating..." : "Create Listing"}
          </button>
        </form>
      )}

      <div className="listings-list">
        {listings.length === 0 ? (
          <div className="empty">No listings yet. Add one!</div>
        ) : listings.map((l) => (
          <div key={l._id} className={`listing-item ${l.isFilled ? "filled" : ""}`}>
            {l.photos?.[0] && <img src={l.photos[0]} alt={l.title} className="listing-thumb" />}
            <div className="listing-info">
              <h3>{l.title}</h3>
              <p>📍 {l.location} &nbsp;|&nbsp; ₹{l.rent?.toLocaleString()}/mo &nbsp;|&nbsp; {l.roomType}</p>
              {l.isFilled && <span className="tag-filled">Filled</span>}
            </div>
            <div className="listing-actions">
              {!l.isFilled && (
                <button className="btn-fill" onClick={() => handleFill(l._id)}>Mark Filled</button>
              )}
              <button className="btn-delete" onClick={() => handleDelete(l._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
