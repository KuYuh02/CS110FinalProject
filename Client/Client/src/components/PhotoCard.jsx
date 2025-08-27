import React from "react";

function PhotoCard({ photo }) {
  return (
    <div style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
      <img
        src={photo.image}
        alt={photo.title}
        style={{ width: "100%", maxWidth: "300px" }}
      />
      <h3>{photo.title}</h3>
      <p>{photo.description}</p>
      <p>Tags: {photo.tags.join(", ")}</p>
    </div>
  );
}

export default PhotoCard;