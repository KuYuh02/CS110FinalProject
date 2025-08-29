import mongoose from "mongoose";

const photoSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: { type: String, required: true }, // base64 or URL
  tags: [String],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Photo", photoSchema);