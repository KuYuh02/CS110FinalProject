import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PhotoCard from "../components/PhotoCard";
import UploadForm from "../components/UploadForm";
import { photosAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user } = useAuth();
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
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Welcome to SnapShare</h1>
      
      {/* Recommendations Preview Section */}
      {user && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-lg shadow-lg mb-8 text-center">
          <h2 className="text-3xl font-bold mb-3">
            💡 Discover New Connections
          </h2>
          <p className="text-lg opacity-90 mb-6">
            Get personalized user recommendations based on your likes, follows, and photo preferences
          </p>
          <Link 
            to="/recommendations"
            className="inline-block bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-lg font-semibold py-3 px-8 rounded-full transition-all duration-300 ease-in-out border border-white border-opacity-30"
          >
            Explore Recommendations →
          </Link>
        </div>
      )}
      
      <div className="mb-8">
        <UploadForm onUpload={handleUpload} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {photos.map((p) => (
          <PhotoCard key={p.id} photo={p} onUpdated={handleUpdated} onDeleted={handleDeleted} />
        ))}
      </div>
    </div>
  );
}

export default Home;