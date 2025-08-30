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
    <div>
      <h1>SnapShare</h1>
      
      {/* Recommendations Preview Section */}
      {user && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
            💡 Discover New Connections
          </h2>
          <p style={{ margin: '0 0 20px 0', opacity: 0.9 }}>
            Get personalized user recommendations based on your likes, follows, and photo preferences
          </p>
          <Link 
            to="/recommendations"
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 'bold',
              border: '2px solid rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.borderColor = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
          >
            Explore Recommendations →
          </Link>
        </div>
      )}
      
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