import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';
import sriService from '../../services/sri';
import './SRI.css';

export const SRI = () => {
  // Form state
  const [activityTitle, setActivityTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveLink, setDriveLink] = useState('');
  
  // API data state
  const [pastActivities, setPastActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const submissionsData = await sriService.getMySubmissions();
      // Show all submissions, sorted by most recent first
      setPastActivities(submissionsData.slice(0, 20));
    } catch (error) {
      console.error('Error fetching SRI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!activityTitle || !description || !driveLink) {
      alert('Please fill in all fields (Title, Description, Drive Link)');
      return;
    }

    try {
      setSubmitting(true);
      await sriService.createSubmission({
        activity_title: activityTitle,
        activity_type: 'community',
        activity_date: new Date().toISOString().split('T')[0],
        activity_hours: 1,
        people_helped: null,
        description: description,
        personal_reflection: description,
        photo_drive_link: driveLink,
        status: 'draft'
      });
      
      alert('Activity saved as draft!');
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!activityTitle || !description || !driveLink) {
      alert('Please fill in all fields (Title, Description, Drive Link)');
      return;
    }

    try {
      setSubmitting(true);
      await sriService.createSubmission({
        activity_title: activityTitle,
        activity_type: 'community',
        activity_date: new Date().toISOString().split('T')[0],
        activity_hours: 1,
        people_helped: null,
        description: description,
        personal_reflection: description,
        photo_drive_link: driveLink,
        status: 'submitted'
      });
      
      alert('Activity submitted successfully!');
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error submitting activity:', error);
      alert('Failed to submit activity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setActivityTitle('');
    setDescription('');
    setDriveLink('');
  };

  if (loading) {
    return (
      <div className="sri-container">
        <div className="sri-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sri-container">
      {/* Header */}
      <motion.div
        className="sri-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="sri-title">Social Responsibility Initiatives</h1>
        <p className="sri-subtitle">
          Submit your social service activities and track their approval status
        </p>
      </motion.div>

      <div className="sri-layout">
        {/* Main Content */}
        <div className="sri-main">
          <GlassCard variant="medium" className="sri-form-card">
            <h2 className="sri-form-title">Create Submission</h2>

            {/* Activity Title */}
            <div className="sri-input-group">
              <label className="sri-label">Activity Title</label>
              <input
                type="text"
                className="sri-input"
                placeholder="e.g., Community Clean-up Drive"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="sri-input-group">
              <label className="sri-label">Description</label>
              <textarea
                className="sri-textarea"
                rows="4"
                placeholder="Describe your social responsibility activity..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Drive Link */}
            <div className="sri-input-group">
              <label className="sri-label">Drive Link</label>
              <input
                type="text"
                className="sri-input"
                placeholder="Add drive link to photos/documents"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
              />
            </div>

            <div className="sri-form-actions">
              <Button
                variant="primary"
                withGlow
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="sri-sidebar">
          {/* Recent Submissions */}
          <GlassCard variant="medium" className="sri-timeline-card">
            <h3 className="sri-timeline-title">Recent Submissions</h3>

            <div className="sri-timeline">
              {pastActivities.length === 0 ? (
                <div className="sri-no-activities">
                  <p>No submissions yet. Create your first submission!</p>
                </div>
              ) : (
                pastActivities.map((activity, index) => {
                  // Status badge styling
                  const getStatusStyle = (status) => {
                    const styles = {
                      'draft': { bg: '#6b7280', text: 'Draft' },
                      'submitted': { bg: '#3b82f6', text: 'Submitted' },
                      'under_review': { bg: '#8b5cf6', text: 'Under Review' },
                      'approved': { bg: '#10b981', text: 'Approved' },
                      'rejected': { bg: '#ef4444', text: 'Rejected' }
                    };
                    return styles[status] || styles['draft'];
                  };
                  
                  const statusStyle = getStatusStyle(activity.status);
                  
                  return (
                    <motion.div
                      key={activity.id}
                      className="sri-timeline-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="sri-timeline-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 className="sri-timeline-activity">{activity.activity_title}</h4>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: statusStyle.bg,
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            marginLeft: '8px'
                          }}>
                            {statusStyle.text}
                          </span>
                        </div>
                        <div className="sri-timeline-meta">
                          <span className="sri-timeline-date">{activity.activity_date}</span>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                          {activity.description && activity.description.length > 100 
                            ? activity.description.substring(0, 100) + '...' 
                            : activity.description}
                        </div>
                        {activity.reviewer_comments && (
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '8px', 
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.8)'
                          }}>
                            <strong>Reviewer:</strong> {activity.reviewer_comments}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SRI;
