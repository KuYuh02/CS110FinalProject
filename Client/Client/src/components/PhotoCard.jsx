import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { photosAPI } from "../services/api";

function PhotoCard({ photo, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const isOwner = user && user.id === photo.userId;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(photo.title);
  const [editDescription, setEditDescription] = useState(photo.description);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const updated = await photosAPI.like(photo.id);
      onUpdated && onUpdated(updated);
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;
    setBusy(true);
    try {
      const updated = await photosAPI.comment(photo.id, commentText.trim());
      setCommentText("");
      onUpdated && onUpdated(updated);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !isOwner) return;
    setBusy(true);
    try {
      await photosAPI.delete(photo.id);
      onDeleted && onDeleted(photo.id);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !isOwner) return;
    setBusy(true);
    try {
      const updated = await photosAPI.update(photo.id, {
        title: editTitle,
        description: editDescription
      });
      onUpdated && onUpdated(updated);
      setIsEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
      <img
        src={photo.image}
        alt={photo.title}
        style={{ width: "100%", maxWidth: "300px" }}
      />
      {isEditing ? (
        <div>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          <div>
            <button onClick={handleSaveEdit} disabled={busy}>Save</button>
            <button onClick={() => setIsEditing(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h3>{photo.title}</h3>
          <p>{photo.description}</p>
          <div>
            By: <Link to={`/profile/${photo.userId}`}>{photo.username}</Link>
          </div>
        </>
      )}
      <p>Tags: {photo.tags.join(", ")}</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleLike} disabled={busy || !user}>
          Like ({photo.likes?.length || 0})
        </button>
        {isOwner && !isEditing && (
          <button onClick={() => setIsEditing(true)} disabled={busy}>Edit</button>
        )}
        {isOwner && (
          <button onClick={handleDelete} disabled={busy}>Delete</button>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <div>
          <strong>Comments</strong>
        </div>
        {(photo.comments || []).map((c, idx) => (
          <div key={idx}>
            <strong>{c.username}:</strong> {c.text}
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <input
            placeholder="Add a comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={!user || busy}
          />
          <button onClick={handleComment} disabled={!user || busy || !commentText.trim()}>Post</button>
        </div>
      </div>
    </div>
  );
}

export default PhotoCard;