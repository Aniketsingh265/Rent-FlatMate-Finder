import { useState, useEffect } from "react";
import { getTenantProfile, saveTenantProfile } from "../services/api";
import toast from "react-hot-toast";
import "./TenantProfilePage.css";

export default function TenantProfilePage() {
  const [form, setForm] = useState({
    preferredLocation: "", budgetMin: "", budgetMax: "",
    moveInDate: "", bio: "",
    preferences: { furnished: null, roomType: "any", gender: "any" },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTenantProfile().then((res) => {
      if (res.data.profile) {
        const p = res.data.profile;
        setForm({
          preferredLocation: p.preferredLocation || "",
          budgetMin: p.budgetMin || "",
          budgetMax: p.budgetMax || "",
          moveInDate: p.moveInDate ? p.moveInDate.substring(0, 10) : "",
          bio: p.bio || "",
          preferences: p.preferences || { furnished: null, roomType: "any", gender: "any" },
        });
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveTenantProfile(form);
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Tenant Profile</h1>
        <p>Set your preferences to get AI-matched listings</p>
      </div>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h2>Location & Budget</h2>
          <div className="form-group">
            <label>Preferred Location</label>
            <input placeholder="e.g. Andheri, Mumbai" value={form.preferredLocation}
              onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Min Budget (₹)</label>
              <input type="number" placeholder="5000" value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Max Budget (₹)</label>
              <input type="number" placeholder="15000" value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Move-in Date</label>
            <input type="date" value={form.moveInDate}
              onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} required />
          </div>
        </div>

        <div className="form-section">
          <h2>Preferences</h2>
          <div className="form-group">
            <label>Room Type</label>
            <div className="option-group">
              {["any", "single", "shared"].map((t) => (
                <button key={t} type="button"
                  className={`option-btn ${form.preferences.roomType === t ? "active" : ""}`}
                  onClick={() => setForm({ ...form, preferences: { ...form.preferences, roomType: t } })}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Gender Preference</label>
            <div className="option-group">
              {["any", "male", "female"].map((g) => (
                <button key={g} type="button"
                  className={`option-btn ${form.preferences.gender === g ? "active" : ""}`}
                  onClick={() => setForm({ ...form, preferences: { ...form.preferences, gender: g } })}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Furnished?</label>
            <div className="option-group">
              {[{ label: "Any", val: null }, { label: "Yes", val: true }, { label: "No", val: false }].map(({ label, val }) => (
                <button key={label} type="button"
                  className={`option-btn ${form.preferences.furnished === val ? "active" : ""}`}
                  onClick={() => setForm({ ...form, preferences: { ...form.preferences, furnished: val } })}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>About Me</h2>
          <div className="form-group">
            <label>Bio</label>
            <textarea rows={4} placeholder="Tell owners a bit about yourself..."
              value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} />
            <small>{form.bio.length}/500</small>
          </div>
        </div>

        <button type="submit" className="btn-save" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
