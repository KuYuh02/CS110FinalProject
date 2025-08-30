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
    return <div className="container mx-auto py-8 text-center text-gray-700">Searching...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center alert-error">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Search Results for "<span className="text-indigo-600">{query}</span>"
      </h1>
      
      {users.length === 0 && photos.length === 0 ? (
        <p className="text-gray-700 text-center text-lg">No results found for your query. Try a different search term.</p>
      ) : (
        <div className="space-y-12">
          {users.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                  <Link key={u.id} to={`/profile/${u.id}`} className="card flex items-center p-4 gap-4 hover:shadow-md transition-shadow duration-200">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.profilePicture ? (
                        <img src={u.profilePicture} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl text-gray-500">{(u.username || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg text-gray-900 truncate">{u.username}</div>
                      <div className="text-sm text-gray-500 truncate">{u.bio || 'No bio provided.'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {photos.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Photos</h2>
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