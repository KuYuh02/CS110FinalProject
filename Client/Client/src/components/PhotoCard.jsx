import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { photosAPI } from "../services/api";

function PhotoCard({ photo, onUpdated, onDeleted }) {
  const { user } = useAuth();
  
  const isOwner = user && String(user.id) === String(photo.userId);
  
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
    <div className="card mb-6">
      <img
        src={photo.image}
        alt={photo.title}
        className="w-full h-auto rounded-md mb-4"
      />
      {isEditing ? (
        <div className="space-y-4">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="input-field text-xl font-semibold"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="input-field text-gray-700"
            rows="3"
          />
          <div className="flex gap-4 mt-4">
            <button onClick={handleSaveEdit} disabled={busy} className="button-primary">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} disabled={busy} className="button-primary button-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{photo.title}</h3>
          <p className="text-gray-700">{photo.description}</p>
          <div className="text-sm text-gray-500">
            By: <Link to={`/profile/${photo.userId}`} className="link-style">{photo.username}</Link>
          </div>
        </div>
      )}
      <p className="text-sm text-gray-500 mt-4">Tags: {photo.tags.join(", ")}</p>
      <div className="flex gap-4 items-center mt-4 border-t border-gray-200 pt-4 flex-wrap">
        <button onClick={handleLike} disabled={busy || !user} className="button-primary button-sm">
          Like ({photo.likes?.length || 0})
        </button>
        {isOwner && !isEditing && (
          <button onClick={() => setIsEditing(true)} disabled={busy} className="button-primary button-secondary button-sm">
            Edit
          </button>
        )}
        {isOwner && (
          <button onClick={handleDelete} disabled={busy} className="button-primary button-danger button-sm">
            Delete
          </button>
        )}
      </div>
      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="text-lg font-semibold text-gray-900 mb-2">
          Comments
        </div>
        {(photo.comments || []).map((c, idx) => (
          <div key={idx} className="mb-2 p-2 bg-gray-50 rounded-md">
            <strong className="text-gray-700">{c.username || 'Anonymous'}:</strong>{' '}
            <span className="text-gray-700">{c.text}</span>
          </div>
        ))}
        <div className="mt-4 flex gap-2">
          <input
            placeholder="Add a comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={!user || busy}
            className="input-field flex-grow"
          />
          <button onClick={handleComment} disabled={!user || busy || !commentText.trim()} className="button-primary">
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotoCard;