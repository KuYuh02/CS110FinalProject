import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../services/api';
import PhotoCard from '../components/PhotoCard';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [photos, setPhotos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        const results = await searchAPI.search(query);
        setPhotos(results.photos || []);
        setUsers(results.users || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchSearchResults();
    }
  }, [query]);

  if (loading) {
    return <div className="flex justify-center py-8">Searching...</div>;
  }

  if (error) {
    return <div className="flex justify-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for "{query}"
      </h1>
      
      {users.length === 0 && photos.length === 0 ? (
        <p className="text-gray-500">No results found.</p>
      ) : (
        <div className="space-y-8">
          {users.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(u => (
                  <Link key={u.id} to={`/profile/${u.id}`} className="bg-white shadow rounded p-4 flex items-center hover:shadow-md">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      {u.profilePicture ? (
                        <img src={u.profilePicture} alt={u.username} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-lg text-gray-500">{(u.username || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{u.username}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{u.bio || 'No bio'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {photos.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map(photo => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;