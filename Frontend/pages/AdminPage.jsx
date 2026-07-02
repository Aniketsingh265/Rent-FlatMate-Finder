import { useState, useEffect } from "react";
import { getAdminStats, getAdminUsers, deleteUser, getAdminListings, adminDeleteListing } from "../services/api";
import toast from "react-hot-toast";
import "./AdminPage.css";

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [tab, setTab] = useState("stats");

  useEffect(() => {
    getAdminStats().then((r) => setStats(r.data.stats)).catch(() => {});
    getAdminUsers().then((r) => setUsers(r.data.users)).catch(() => {});
    getAdminListings().then((r) => setListings(r.data.listings)).catch(() => {});
  }, []);

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try { await deleteUser(id); toast.success("User deleted"); setUsers(users.filter(u => u._id !== id)); }
    catch { toast.error("Failed"); }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm("Delete this listing?")) return;
    try { await adminDeleteListing(id); toast.success("Listing deleted"); setListings(listings.filter(l => l._id !== id)); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage the platform</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card purple"><div className="stat-number">{stats.users}</div><div className="stat-label">Total Users</div></div>
          <div className="stat-card blue"><div className="stat-number">{stats.listings}</div><div className="stat-label">Listings</div></div>
          <div className="stat-card orange"><div className="stat-number">{stats.interests}</div><div className="stat-label">Interests</div></div>
        </div>
      )}

      <div className="admin-tabs">
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>Users</button>
        <button className={tab === "listings" ? "active" : ""} onClick={() => setTab("listings")}>Listings</button>
      </div>

      {tab === "users" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                  <td><button className="btn-del" onClick={() => handleDeleteUser(u._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "listings" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Location</th><th>Rent</th><th>Owner</th><th>Action</th></tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l._id}>
                  <td>{l.title}</td>
                  <td>{l.location}</td>
                  <td>₹{l.rent?.toLocaleString()}</td>
                  <td>{l.owner?.name}</td>
                  <td><button className="btn-del" onClick={() => handleDeleteListing(l._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
