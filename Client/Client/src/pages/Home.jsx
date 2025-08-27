import React, { useEffect, useState } from "react";
import PhotoCard from "../components/PhotoCard";
import UploadForm from "../components/UploadForm";
import { photosAPI } from "../services/api";

function Home() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await photosAPI.getAll();
        setPhotos(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleUpload = (photoData) => {
    setPhotos([photoData, ...photos]);
  };

  const handleUpdated = (updated) => {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleted = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <h1>SnapShare</h1>
      <UploadForm onUpload={handleUpload} />
      <div>
        {photos.map((p) => (
          <PhotoCard key={p.id} photo={p} onUpdated={handleUpdated} onDeleted={handleDeleted} />
        ))}
      </div>
    </div>
  );
}

export default Home;