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
    if (score >= 10) return "#4CAF50"; // Green
    if (score >= 6) return "#8BC34A"; // Light green
    if (score >= 3) return "#FFC107"; // Yellow
    return "#FF9800"; // Orange
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Recommendations</h2>
        <p>Please log in to see personalized recommendations.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Recommendations</h2>
        <p>Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Recommendations</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={loadRecommendations}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>💡 Personalized Recommendations</h2>
      
      {/* User Stats */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        gap: '20px',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {userStats.totalLikedPhotos || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Photos Liked</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {userStats.totalFollowedUsers || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Users Followed</div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No recommendations yet</h3>
          <p>Start liking photos and following users to get personalized recommendations!</p>
        </div>
      ) : (
        <div>
          <h3>Users You Might Like</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Based on your likes, follows, and photo preferences
          </p>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {recommendations.map((rec) => (
              <div key={rec.id} style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {/* Profile Picture */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: rec.profilePicture || '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: '#666',
                    overflow: 'hidden'
                  }}>
                    {rec.profilePicture ? (
                      <img 
                        src={rec.profilePicture} 
                        alt={rec.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      rec.username.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* User Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <Link 
                        to={`/profile/${rec.id}`}
                        style={{ 
                          textDecoration: 'none', 
                          color: '#2196F3',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}
                      >
                        {rec.username}
                      </Link>
                      <span style={{
                        background: getSimilarityColor(rec.similarityScore),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getSimilarityDescription(rec.similarityScore, rec.commonLikedPhotos, rec.commonFollowedUsers, rec.similarTags)}
                      </span>
                    </div>
                    
                    {rec.bio && (
                      <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}>
                        {rec.bio}
                      </p>
                    )}

                    {/* Similarity Details */}
                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#888' }}>
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
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      background: followStatuses[rec.id] ? '#f44336' : '#2196F3',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = followStatuses[rec.id] ? '#d32f2f' : '#1976D2';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = followStatuses[rec.id] ? '#f44336' : '#2196F3';
                    }}
                  >
                    {followStatuses[rec.id] ? 'Unfollow' : 'Follow'}
                  </button>
                </div>

                {/* Similarity Score Bar */}
                <div style={{ marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>Similarity Score</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: getSimilarityColor(rec.similarityScore) }}>
                      {rec.similarityScore}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: '#e0e0e0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min((rec.similarityScore / 15) * 100, 100)}%`,
                      height: '100%',
                      background: getSimilarityColor(rec.similarityScore),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button 
              onClick={loadRecommendations}
              style={{
                padding: '12px 24px',
                borderRadius: '25px',
                border: 'none',
                background: '#2196F3',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
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
