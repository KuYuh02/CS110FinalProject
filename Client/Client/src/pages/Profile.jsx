import { useState, useEffect } from 'react';
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

  const isOwnProfile = currentUser && currentUser.id === id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData, allPhotos] = await Promise.all([
          usersAPI.getById(id),
          photosAPI.getAll()
        ]);
        
        setProfileUser(userData);
        setFormData({
          username: userData.username,
          bio: userData.bio || '',
          profilePicture: userData.profilePicture || ''
        });
        
        const userPhotos = allPhotos.filter(photo => photo.userId === id);
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
        // Update context if it's the current user
        const { updateUser } = useAuth();
        updateUser(updatedUser);
      }
    } catch (err) {
      setError(err.message);
    }
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
                  <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
                  <input
                    type="text"
                    value={formData.profilePicture}
                    onChange={(e) => setFormData({...formData, profilePicture: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
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