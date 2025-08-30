import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { recommendationsAPI } from '../services/api';
import { usersAPI } from '../services/api';

function Recommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followStatuses, setFollowStatuses] = useState({});

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recommendationsAPI.getRecommendations();
      setRecommendations(data.recommendations);
      setUserStats(data.userStats);
      
      // Initialize follow statuses
      const statuses = {};
      data.recommendations.forEach(rec => {
        statuses[rec.id] = false; // Default to not following
      });
      setFollowStatuses(statuses);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await usersAPI.follow(userId);
      setFollowStatuses(prev => ({
        ...prev,
        [userId]: !prev[userId]
      }));
      // Reload recommendations to update similarity scores
      loadRecommendations();
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  const getSimilarityDescription = (score, commonLiked, commonFollowed, similarTags) => {
    if (score >= 10) return "Very similar preferences";
    if (score >= 6) return "Similar interests";
    if (score >= 3) return "Some common interests";
    return "Slight overlap";
  };

  const getSimilarityColor = (score) => {
    if (score >= 10) return "#4CAF50"; // Green - will map to a minimalist green
    if (score >= 6) return "#8BC34A"; // Light green
    if (score >= 3) return "#FFC107"; // Yellow
    return "#FF9800"; // Orange
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommendations</h2>
        <p className="text-gray-700">Please log in to see personalized recommendations.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommendations</h2>
        <p className="text-gray-700">Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommendations</h2>
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button onClick={loadRecommendations} className="button-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">💡 Personalized Recommendations</h2>
      
      {/* User Stats */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 flex gap-8 justify-center border border-gray-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-indigo-600 mb-1">
            {userStats.totalLikedPhotos || 0}
          </div>
          <div className="text-sm text-gray-500">Photos Liked</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-indigo-600 mb-1">
            {userStats.totalFollowedUsers || 0}
          </div>
          <div className="text-sm text-gray-500">Users Followed</div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 card">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-700">Start liking photos and following users to get personalized recommendations!</p>
        </div>
      ) : (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Users You Might Like</h3>
          <p className="text-gray-700 mb-6">
            Based on your likes, follows, and photo preferences
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="card">
                <div className="flex items-center gap-4 mb-4">
                  {/* Profile Picture */}
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-600 overflow-hidden flex-shrink-0">
                    {rec.profilePicture ? (
                      <img 
                        src={rec.profilePicture} 
                        alt={rec.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      rec.username.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        to={`/profile/${rec.id}`}
                        className="text-lg font-semibold text-indigo-600 hover:underline truncate"
                      >
                        {rec.username}
                      </Link>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getSimilarityColor(rec.similarityScore) }}
                      >
                        {getSimilarityDescription(rec.similarityScore, rec.commonLikedPhotos, rec.commonFollowedUsers, rec.similarTags)}
                      </span>
                    </div>
                    
                    {rec.bio && (
                      <p className="text-sm text-gray-500 mb-2 truncate">
                        {rec.bio}
                      </p>
                    )}

                    {/* Similarity Details */}
                    <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                      <span>📸 {rec.photoCount} photos</span>
                      {rec.commonLikedPhotos > 0 && (
                        <span>❤️ {rec.commonLikedPhotos} common likes</span>
                      )}
                      {rec.commonFollowedUsers > 0 && (
                        <span>👥 {rec.commonFollowedUsers} common follows</span>
                      )}
                      {rec.similarTags > 0 && (
                        <span>🏷️ {rec.similarTags} similar tags</span>
                      )}
                    </div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => handleFollow(rec.id)}
                    className={`button-primary ${followStatuses[rec.id] ? 'bg-red-500 hover:bg-red-600' : ''} button-sm flex-shrink-0`}
                  >
                    {followStatuses[rec.id] ? 'Unfollow' : 'Follow'}
                  </button>
                </div>

                {/* Similarity Score Bar */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500">Similarity Score</span>
                    <span className="text-xs font-semibold" style={{ color: getSimilarityColor(rec.similarityScore) }}>
                      {rec.similarityScore}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((rec.similarityScore / 15) * 100, 100)}%`,
                        backgroundColor: getSimilarityColor(rec.similarityScore),
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={loadRecommendations}
              className="button-primary px-6 py-3 rounded-full"
            >
              🔄 Refresh Recommendations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recommendations;
