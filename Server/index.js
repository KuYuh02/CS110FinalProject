import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import { register, login, authenticateToken } from "./auth.js";
import User from "./models/User.js";
import Photo from "./models/Photo.js";

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Auth routes
app.post("/api/register", register);
app.post("/api/login", login);

// Photos
app.get("/api/photos", async (req, res) => {
  try {
    const photos = await Photo.find().populate("uploadedBy", "username");
    res.json(photos);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/photos", authenticateToken, async (req, res) => {
  try {
    const { title, description, image, tags } = req.body;
    const newPhoto = await Photo.create({
      title,
      description,
      image,
      tags: Array.isArray(tags)
        ? tags
        : String(tags || "")
            .split(",")
            .map((t) => t.trim()),
      uploadedBy: req.user.id,
    });
    res.status(201).json(newPhoto);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ... keep the rest of your routes (PUT, like, comment, delete, users, search) unchanged ...

// Start server (only once!)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});