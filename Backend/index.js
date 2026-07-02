require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const {connectDB} = require("./connection");

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/Rent-Flatmate-Finder";
connectDB(MONGO_URI).then(()=>console.log("Connected to MongoDB")).catch((err)=>console.log(err));

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.set("io", io);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listing"));
app.use("/api/tenants", require("./routes/tenant"));
app.use("/api/interests", require("./routes/interest"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/admin", require("./routes/admin"));


// Health check
app.get("/", (req, res) => {
  res.json({ message: "Rent & Flatmate Finder API is running!" });
  console.log("Rent & Flatmate Finder is Running")
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Socket.io connection handler
require("./services/socket")(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});