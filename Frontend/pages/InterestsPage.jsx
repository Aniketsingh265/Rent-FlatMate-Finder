import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyInterests, getReceivedInterests, respondInterest } from "../services/api";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import "./InterestsPage.css";

export default function InterestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  const fetchInterests = async () => {
    try {
      const res = user.role === "tenant" ? await getMyInterests() : await getReceivedInterests();
      setInterests(res.data.interests);
    } catch {
      toast.error("Failed to load interests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterests(); }, []);

  const handleRespond = async (id, status) => {
    setRespondingId(id);
    try {
      await respondInterest(id, status);
      toast.success(`Interest ${status}`);
      await fetchInterests();
    } catch {
      toast.error("Failed");
    } finally {
      setRespondingId(null);
    }
  };

  const statusColor = { pending: "#fef3c7", accepted: "#d1fae5", declined: "#fee2e2" };
  const statusText = { pending: "#d97706", accepted: "#065f46", declined: "#dc2626" };

  return (
    <div className="interests-container">
      <div className="interests-header">
        <h1>{user.role === "tenant" ? "My Interests" : "Received Interests"}</h1>
        <p>{user.role === "tenant" ? "Track your interest requests" : "Manage tenant interest requests"}</p>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : interests.length === 0 ? (
        <div className="empty">No interests yet.</div>
      ) : (
        <div className="interests-list">
          {interests.map((i) => (
            <div key={i._id} className="interest-card">
              <div className="interest-top">
                <div>
                  <h3>{i.listing?.title}</h3>
                  <p className="interest-sub">📍 {i.listing?.location} &nbsp;|&nbsp; ₹{i.listing?.rent?.toLocaleString()}/mo</p>
                  {user.role === "owner" && <p className="interest-from">From: <strong>{i.tenant?.name}</strong> ({i.tenant?.email})</p>}
                  {user.role === "tenant" && <p className="interest-from">Owner: <strong>{i.owner?.name}</strong></p>}
                  {i.message && <p className="interest-message">"{i.message}"</p>}
                  {i.compatibilityScore && <p className="interest-score">Match Score: <strong>{i.compatibilityScore}/100</strong></p>}
                </div>
                <span className="status-badge" style={{ background: statusColor[i.status], color: statusText[i.status] }}>
                  {i.status}
                </span>
              </div>

              <div className="interest-actions">
                {user.role === "owner" && i.status === "pending" && (
                  <>
                    <button className="btn-accept" disabled={respondingId === i._id}
                      onClick={() => handleRespond(i._id, "accepted")}>
                      {respondingId === i._id ? "Processing..." : "Accept"}
                    </button>
                    <button className="btn-decline" disabled={respondingId === i._id}
                      onClick={() => handleRespond(i._id, "declined")}>
                      {respondingId === i._id ? "Processing..." : "Decline"}
                    </button>
                  </>
                )}
                {i.status === "accepted" && (
                  <button className="btn-chat" onClick={() => navigate(`/chat/${i._id}`)}>Open Chat</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
