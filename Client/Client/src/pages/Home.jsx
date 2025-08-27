import React, { useState } from "react";
import PhotoCard from "../components/PhotoCard";
import UploadForm from "../components/UploadForm";

function Home() {
  const [photos, setPhotos] = useState([]);

  const handleUpload = (photoData) => {
    setPhotos([photoData, ...photos]);
  };

  return (
    <div>
      <h1>SnapShare</h1>
      <UploadForm onUpload={handleUpload} />
      <div>
        {photos.map((p, idx) => (
          <PhotoCard key={idx} photo={p} />
        ))}
      </div>
    </div>
  );
}

export default Home;