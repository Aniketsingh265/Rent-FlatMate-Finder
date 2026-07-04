const jwt = require("jsonwebtoken");
const Message = require("../models/message");
const User = require("../models/user");
const Interest = require("../models/interest");

// A socket may only join/message a chat if its user is the tenant or owner
// on that interest, and the interest has been accepted.
const canAccessInterest = async (userId, interestId) => {
  const interest = await Interest.findById(interestId);
  if (!interest || interest.status !== "accepted") return false;
  return (
    interest.tenant.toString() === userId.toString() ||
    interest.owner.toString() === userId.toString()
  );
};

module.exports = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.user?.name}`);

    // Join a chat room (based on interest ID)
    socket.on("join_room", async (interestId) => {
      if (!(await canAccessInterest(socket.user._id, interestId))) {
        return socket.emit("error", { message: "Access denied to this chat" });
      }
      socket.join(interestId);
      console.log(`📬 ${socket.user.name} joined room: ${interestId}`);
    });

    // Send a message
    socket.on("send_message", async ({ interestId, content }) => {
      try {
        if (!(await canAccessInterest(socket.user._id, interestId))) {
          return socket.emit("error", { message: "Access denied to this chat" });
        }

        const message = await Message.create({
          interest: interestId,
          sender: socket.user._id,
          content,
        });

        const populated = await message.populate("sender", "name avatar");

        // Broadcast to everyone in the room
        io.to(interestId).emit("receive_message", populated);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Mark messages as read
    socket.on("mark_read", async ({ interestId }) => {
      if (!(await canAccessInterest(socket.user._id, interestId))) return;
      await Message.updateMany(
        { interest: interestId, readBy: { $ne: socket.user._id } },
        { $push: { readBy: socket.user._id } }
      );
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user?.name}`);
    });
  });
};