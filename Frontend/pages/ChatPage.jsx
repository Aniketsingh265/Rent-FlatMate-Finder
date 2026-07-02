import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getChatHistory } from "../services/api";
import { useAuth } from "../context/auth";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import "./ChatPage.css";

export default function ChatPage() {
  const { interestId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [socket, setSocket] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    getChatHistory(interestId)
      .then((res) => setMessages(res.data.messages))
      .catch(() => toast.error("Failed to load chat"));

    const token = localStorage.getItem("token");
    const s = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: { token },
    });

    s.emit("join_room", interestId);
    s.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));
    setSocket(s);

    return () => s.disconnect();
  }, [interestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!content.trim() || !socket) return;
    socket.emit("send_message", { interestId, content });
    setContent("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat</h2>
        <p>Messages are end-to-end saved</p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && <div className="no-messages">No messages yet. Say hi!</div>}
        {messages.map((msg) => {
          const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
          return (
            <div key={msg._id} className={`message ${isMe ? "me" : "them"}`}>
              {!isMe && <p className="msg-sender">{msg.sender?.name}</p>}
              <div className="msg-bubble">{msg.content}</div>
              <p className="msg-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <textarea
          placeholder="Type a message... (Enter to send)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button className="btn-send" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
