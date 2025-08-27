import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { register, login, authenticateToken } from "./auth.js";
import User from "./models/User.js";
import Photo from "./models/Photo.js";

dotenv.config();

// ----------------- MONGODB ----------------- //
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ----------------- EXPRESS ----------------- //
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ----------------- AUTH ROUTES ----------------- //
app.post("/api/register", register);
app.post("/api/login", login);

// ----------------- PHOTO ROUTES ----------------- //
// Get all photos
app.get("/api/photos", async (req, res) => {
  try {
    const photos = await Photo.find().populate("uploadedBy", "username");
    res.json(photos);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload a photo
app.post("/api/photos", authenticateToken, async (req, res) => {
  try {
    const { title, description, image, tags } = req.body;
    const newPhoto = await Photo.create({
      title,
      description,
      image,
      tags: Array.isArray(tags) ? tags : String(tags || "").split(",").map(t => t.trim()),
      uploadedBy: req.user.id
    });
    res.status(201).json(newPhoto);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Edit a photo
app.put("/api/photos/:id", authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    if (photo.uploadedBy.toString() !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    Object.assign(photo, req.body);
    await photo.save();
    res.json(photo);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Like/unlike a photo
app.post("/api/photos/:id/like", authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    const index = photo.likes.indexOf(req.user.id);
    if (index === -1) {
      photo.likes.push(req.user.id);
    } else {
      photo.likes.splice(index, 1);
    }

    await photo.save();
    res.json(photo);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Comment on a photo
app.post("/api/photos/:id/comment", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    photo.comments.push({
      userId: req.user.id,
      username: req.user.username,
      text
    });
    await photo.save();
    res.json(photo);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a photo
app.delete("/api/photos/:id", authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    if (photo.uploadedBy.toString() !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    await photo.deleteOne();
    res.json({ message: "Photo deleted" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- USER ROUTES ----------------- //
// Get user profile
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all photos by user
app.get("/api/users/:id/photos", async (req, res) => {
  try {
    const photos = await Photo.find({ uploadedBy: req.params.id });
    res.json(photos);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
app.put("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) return res.status(403).json({ error: "Not authorized" });

    const { username, bio, profilePicture } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, bio, profilePicture },
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Follow/unfollow a user
app.post("/api/users/:id/follow", authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) return res.status(400).json({ error: "Cannot follow yourself" });

    const actor = await User.findById(req.user.id);
    const target = await User.findById(targetId);
    if (!actor || !target) return res.status(404).json({ error: "User not found" });

    const isFollowing = actor.following.includes(targetId);
    if (isFollowing) {
      actor.following.pull(targetId);
      target.followers.pull(actor._id);
    } else {
      actor.following.push(targetId);
      target.followers.push(actor._id);
    }

    await actor.save();
    await target.save();

    res.json({ user: actor, following: !isFollowing });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- SEARCH ROUTE ----------------- //
app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      const photos = await Photo.find().limit(20);
      return res.json({ photos, users: [] });
    }

    const regex = new RegExp(q, "i");
    const [photos, users] = await Promise.all([
      Photo.find({
        $or: [{ title: regex }, { description: regex }, { tags: regex }]
      }),
      User.find({
        $or: [{ username: regex }, { bio: regex }]
      }).select("-password")
    ]);

    res.json({ photos, users });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- START SERVER ----------------- //
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));