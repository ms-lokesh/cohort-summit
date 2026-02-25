import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Crown } from 'lucide-react';
import gamificationAPI from '../services/gamification';
import './MentorGamificationPanel.css';

const MentorGamificationPanel = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [menteeLeaderboardData, setMenteeLeaderboardData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('floor'); // 'floor' or 'mentees'

  useEffect(() => {
    fetchLeaderboardData();
    fetchMenteeLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await gamificationAPI.getFullLeaderboard();
      setLeaderboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch floor leaderboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load floor leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenteeLeaderboardData = async () => {
    try {
      const response = await gamificationAPI.getMenteeLeaderboard();
      setMenteeLeaderboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch mentee leaderboard data:', err);
      // Don't set error state here as floor leaderboard might still work
    }
  };

  if (loading) {
    return (
      <div className="mentor-gamification-panel loading">
        <div className="loading-spinner">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mentor-gamification-panel error">
        <p>{error}</p>
      </div>
    );
  }

  if (!leaderboardData) return null;

  // Use data based on active tab
  const currentData = activeTab === 'floor' ? leaderboardData : menteeLeaderboardData;
  if (!currentData) return null;

  // Handle both old and new data structure
  const leaderboard = currentData.leaderboard || [];
  const total_students = currentData.total_students || 0;
  
  // For backwards compatibility with old structure
  const top_ranks = currentData.top_ranks || leaderboard.filter(entry => entry.rank <= 3);
  const percentiles = currentData.percentiles || leaderboard.filter(entry => entry.rank > 3);

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Crown size={24} className="rank-icon gold" />;
      case 2: return <Medal size={24} className="rank-icon silver" />;
      case 3: return <Medal size={24} className="rank-icon bronze" />;
      default: return <Trophy size={20} className="rank-icon default" />;
    }
  };

  const getRankClass = (rank) => {
    switch(rank) {
      case 1: return 'rank-gold';
      case 2: return 'rank-silver';
      case 3: return 'rank-bronze';
      default: return '';
    }
  };

  return (
    <div className="mentor-gamification-panel">
      {/* Tab Switcher */}
      <div className="leaderboard-tabs" style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('floor')}
          style={{
            background: activeTab === 'floor' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px 8px 0 0',
            color: activeTab === 'floor' ? '#818CF8' : 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderBottom: activeTab === 'floor' ? '3px solid #818CF8' : 'none',
          }}
        >
          <Trophy size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Floor Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('mentees')}
          style={{
            background: activeTab === 'mentees' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px 8px 0 0',
            color: activeTab === 'mentees' ? '#818CF8' : 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderBottom: activeTab === 'mentees' ? '3px solid #818CF8' : 'none',
          }}
          disabled={!menteeLeaderboardData}
        >
          <Users size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          My Mentees
        </button>
      </div>

      {/* Header Stats */}
      <div className="gamification-header">
        <div className="header-stat">
          <Users size={20} />
          <div className="stat-content">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{total_students}</span>
          </div>
        </div>
        <div className="header-stat">
          <Trophy size={20} />
          <div className="stat-content">
            <span className="stat-label">Ranked</span>
            <span className="stat-value">{top_ranks.length}</span>
          </div>
        </div>
        <div className="header-stat">
          <TrendingUp size={20} />
          <div className="stat-content">
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{percentiles.length}</span>
          </div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="leaderboard-section">
        <h3 className="section-title">
          <Trophy size={20} />
          Complete Leaderboard
        </h3>

        {/* Top Ranks */}
        {top_ranks.length > 0 && (
          <div className="leaderboard-list">
            <div className="leaderboard-header">
              <span>Rank</span>
              <span>Student</span>
              <span>Score</span>
              <span>Title</span>
            </div>
            {top_ranks.map((entry) => (
              <div 
                key={entry.student_id || entry.id} 
                className={`leaderboard-item ${getRankClass(entry.rank)}`}
              >
                <div className="rank-cell">
                  {getRankIcon(entry.rank)}
                  <span className="rank-number">#{entry.rank}</span>
                </div>
                <div className="student-cell">
                  <div className="student-avatar">
                    {entry.student_first_name?.substring(0, 2).toUpperCase() || entry.student_username?.substring(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div className="student-info">
                    <span className="student-name">{entry.student_first_name || entry.student_name || entry.student_username}</span>
                    <span className="student-username">@{entry.student_username}</span>
                  </div>
                </div>
                <div className="score-cell">
                  <span className="score-value">{entry.season_score}</span>
                  <span className="score-max">/1500</span>
                </div>
                <div className="title-cell">
                  <span className="rank-title">{entry.rank_title || 'Ranked'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Percentile Students */}
        {percentiles.length > 0 && (
          <div className="percentile-section">
            <h4 className="subsection-title">
              <Award size={18} />
              Students by Percentile
            </h4>
            <div className="percentile-list">
              <div className="leaderboard-header">
                <span>Percentile</span>
                <span>Student</span>
                <span>Score</span>
                <span>Breakdown</span>
              </div>
              {percentiles.map((entry) => (
                <div key={entry.student_id || entry.id} className="leaderboard-item percentile-item">
                  <div className="percentile-cell">
                    <Award size={18} className="percentile-icon" />
                    <span className="percentile-value">{entry.percentile || entry.get_percentile_display}</span>
                  </div>
                  <div className="student-cell">
                    <div className="student-avatar">
                      {entry.student_first_name?.substring(0, 2).toUpperCase() || entry.student_username?.substring(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <div className="student-info">
                      <span className="student-name">{entry.student_first_name || entry.student_name || entry.student_username}</span>
                      <span className="student-username">@{entry.student_username}</span>
                    </div>
                  </div>
                  <div className="score-cell">
                    <span className="score-value">{entry.season_score}</span>
                    <span className="score-max">/1500</span>
                  </div>
                  <div className="status-cell">
                    <span className="status-badge" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      CLT:{entry.clt_score} SCD:{entry.scd_score} CFC:{entry.cfc_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {top_ranks.length === 0 && percentiles.length === 0 && (
          <div className="empty-state">
            <Trophy size={48} />
            <p>No students have completed the season yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorGamificationPanel;
