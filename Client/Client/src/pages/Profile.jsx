import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, photosAPI } from '../services/api';
import PhotoCard from '../components/PhotoCard';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    profilePicture: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  const [cropSrc, setCropSrc] = useState('');
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const cropImgRef = useRef(null);

  const isOwnProfile = currentUser && currentUser.id === id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData, userPhotos] = await Promise.all([
          usersAPI.getById(id),
          usersAPI.getPhotos(id)
        ]);
        
        setProfileUser(userData);
        setFormData({
          username: userData.username,
          bio: userData.bio || '',
          profilePicture: userData.profilePicture || ''
        });
        
        setPhotos(userPhotos);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      const updatedUser = await usersAPI.update(id, formData);
      setProfileUser(updatedUser);
      setEditing(false);
      
      if (isOwnProfile) {
        updateUser(updatedUser);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const resizeImageFile = (file, targetSize = 256, mimeType = 'image/jpeg', quality = 0.9) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = targetSize;
          canvas.height = targetSize;

          // Compute cover scaling
          const scale = Math.max(targetSize / img.width, targetSize / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const dx = (targetSize - scaledWidth) / 2;
          const dy = (targetSize - scaledHeight) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, targetSize, targetSize);
          ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);

          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProfilePicFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      setProcessingImage(true);
      // Load selected image for cropping UI first (no resize yet)
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result);
        setCropScale(1);
        setCropOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError('Failed to process image. Please try a different file.');
    } finally {
      setProcessingImage(false);
    }
  };

  const constrainOffset = (offset, scale) => {
    // Ensure the transformed image always covers the 256x256 crop box
    const box = 256;
    const naturalW = imgSize.width || 1;
    const naturalH = imgSize.height || 1;
    const scaleToCover = Math.max(box / naturalW, box / naturalH);
    const effectiveScale = scale * scaleToCover;
    const displayW = naturalW * effectiveScale;
    const displayH = naturalH * effectiveScale;
    const minX = Math.min(0, box - displayW);
    const minY = Math.min(0, box - displayH);
    const maxX = Math.max(0, box - displayW);
    const maxY = Math.max(0, box - displayH);
    return {
      x: Math.min(0, Math.max(minX, Math.min(maxX, offset.x))),
      y: Math.min(0, Math.max(minY, Math.min(maxY, offset.y)))
    };
  };

  const handleCropMouseDown = (e) => {
    setIsDragging(true);
    setLastPoint({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPoint.x;
    const dy = e.clientY - lastPoint.y;
    const next = { x: cropOffset.x + dx, y: cropOffset.y + dy };
    setCropOffset(constrainOffset(next, cropScale));
    setLastPoint({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropTouchStart = (e) => {
    const t = e.touches[0];
    setIsDragging(true);
    setLastPoint({ x: t.clientX, y: t.clientY });
  };

  const handleCropTouchMove = (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - lastPoint.x;
    const dy = t.clientY - lastPoint.y;
    const next = { x: cropOffset.x + dx, y: cropOffset.y + dy };
    setCropOffset(constrainOffset(next, cropScale));
    setLastPoint({ x: t.clientX, y: t.clientY });
  };

  const handleCropTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCropScaleChange = (e) => {
    const nextScale = parseFloat(e.target.value);
    setCropScale(nextScale);
    setCropOffset((off) => constrainOffset(off, nextScale));
  };

  const applyCrop = () => {
    if (!cropSrc || !cropImgRef.current) return;
    const box = 256;
    const naturalW = imgSize.width || 1;
    const naturalH = imgSize.height || 1;
    const scaleToCover = Math.max(box / naturalW, box / naturalH);
    const effectiveScale = cropScale * scaleToCover;

    const canvas = document.createElement('canvas');
    canvas.width = box;
    canvas.height = box;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const img = cropImgRef.current;
    const drawW = naturalW * effectiveScale;
    const drawH = naturalH * effectiveScale;
    const dx = cropOffset.x;
    const dy = cropOffset.y;

    ctx.clearRect(0, 0, box, box);
    ctx.drawImage(img, 0, 0, naturalW, naturalH, dx, dy, drawW, drawH);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setFormData({ ...formData, profilePicture: dataUrl });
  };

  const handleCancel = () => {
    setFormData({
      username: profileUser.username,
      bio: profileUser.bio || '',
      profilePicture: profileUser.profilePicture || ''
    });
    setEditing(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center py-8 text-red-600">{error}</div>;
  }

  if (!profileUser) {
    return <div className="flex justify-center py-8">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 md:mb-0 md:mr-6 flex items-center justify-center">
            {profileUser.profilePicture ? (
              <img 
                src={profileUser.profilePicture} 
                alt={profileUser.username}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <span className="text-4xl text-gray-400">
                {profileUser.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            {editing ? (
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicFileChange}
                    className="mt-1 block w-full"
                  />
                  {processingImage && (
                    <p className="text-sm text-gray-500 mt-1">Processing image…</p>
                  )}
                  {cropSrc && (
                    <div className="mt-3">
                      <div
                        className="relative w-64 h-64 bg-gray-100 overflow-hidden rounded-md select-none"
                        onMouseDown={handleCropMouseDown}
                        onMouseMove={handleCropMouseMove}
                        onMouseUp={handleCropMouseUp}
                        onMouseLeave={handleCropMouseUp}
                        onTouchStart={handleCropTouchStart}
                        onTouchMove={handleCropTouchMove}
                        onTouchEnd={handleCropTouchEnd}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      >
                        <img
                          ref={cropImgRef}
                          src={cropSrc}
                          alt="Crop"
                          className="absolute top-0 left-0"
                          onLoad={(e) => {
                            const nW = e.currentTarget.naturalWidth;
                            const nH = e.currentTarget.naturalHeight;
                            setImgSize({ width: nW, height: nH });
                            // Reset offset to center when new image loads
                            setCropOffset({ x: 0, y: 0 });
                          }}
                          style={{
                            width: `${imgSize.width || 1}px`,
                            height: `${imgSize.height || 1}px`,
                            transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${Math.max(cropScale * Math.max(256 / (imgSize.width || 1), 256 / (imgSize.height || 1)), 0.0001)})`,
                            transformOrigin: 'top left'
                          }}
                        />
                        {/* Visual crop guides and border */}
                        <div className="pointer-events-none absolute inset-0 border-2 border-white/90 rounded-md shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.15)]"></div>
                        {/* Rule of thirds - vertical lines */}
                        <div className="pointer-events-none absolute top-0 bottom-0" style={{ left: '33.333%' }}>
                          <div className="w-px h-full bg-white/40"></div>
                        </div>
                        <div className="pointer-events-none absolute top-0 bottom-0" style={{ left: '66.666%' }}>
                          <div className="w-px h-full bg-white/40"></div>
                        </div>
                        {/* Rule of thirds - horizontal lines */}
                        <div className="pointer-events-none absolute left-0 right-0" style={{ top: '33.333%' }}>
                          <div className="h-px w-full bg-white/40"></div>
                        </div>
                        <div className="pointer-events-none absolute left-0 right-0" style={{ top: '66.666%' }}>
                          <div className="h-px w-full bg-white/40"></div>
                        </div>
                        {/* Crop box is the container itself (256x256). Using 256 logical, but container is 256px (w-64 h-64). */}
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-gray-600 mb-1">Zoom</label>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.01"
                          value={cropScale}
                          onChange={handleCropScaleChange}
                          className="w-full"
                        />
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={applyCrop}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-md"
                        >
                          Apply Crop
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCropSrc('');
                            setCropScale(1);
                            setCropOffset({ x: 0, y: 0 });
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                  {formData.profilePicture && !cropSrc && (
                    <div className="mt-3 w-24 h-24 rounded-full overflow-hidden">
                      <img src={formData.profilePicture} alt="Preview" className="w-24 h-24 object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold">{profileUser.username}</h1>
                <p className="text-gray-600 mt-2">{profileUser.bio || 'No bio yet.'}</p>
                <p className="text-gray-500 mt-4">
                  {photos.length} photos • {profileUser.followers?.length || 0} followers • {profileUser.following?.length || 0} following
                </p>
                
                {isOwnProfile ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md"
                  >
                    Edit Profile
                  </button>
                ) : (
                  currentUser && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await usersAPI.follow(id);
                          updateUser(res.user);
                          // Refresh profile data to reflect follower count
                          const refreshed = await usersAPI.getById(id);
                          setProfileUser(refreshed);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md"
                    >
                      {(currentUser?.following || []).includes(id) ? 'Unfollow' : 'Follow'}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Photos</h2>
        {photos.length === 0 ? (
          <p className="text-gray-500">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onUpdated={(updated) => setPhotos((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
                onDeleted={(deletedId) => setPhotos((prev) => prev.filter((p) => p.id !== deletedId))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;