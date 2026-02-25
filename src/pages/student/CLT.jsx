import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, Image as ImageIcon, Clock, XCircle, CheckCircle2, Edit, Eye } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';
import Input from '../../components/Input';
import ProgressBar from '../../components/ProgressBar';
import cltService from '../../services/clt';
import './CLT.css';

export const CLT = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: '',
    completionDate: '',
    duration: '',
    driveLink: '',
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [showSubmissions, setShowSubmissions] = useState(true);

  const steps = [
    { id: 1, label: 'Course Details', icon: FileText },
    { id: 2, label: 'Learning Evidence', icon: ImageIcon },
    { id: 3, label: 'Review & Submit', icon: CheckCircle },
  ];

  // Get status badge configuration
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', color: '#6b7280', icon: Edit, bg: 'rgba(107, 114, 128, 0.1)' },
      submitted: { label: 'Pending Review', color: '#fbbf24', icon: Clock, bg: 'rgba(251, 191, 36, 0.1)' },
      under_review: { label: 'Under Review', color: '#3b82f6', icon: Eye, bg: 'rgba(59, 130, 246, 0.1)' },
      approved: { label: 'Approved', color: '#10b981', icon: CheckCircle2, bg: 'rgba(16, 185, 129, 0.1)' },
      rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle, bg: 'rgba(239, 68, 68, 0.1)' },
    };
    return statusConfig[status] || statusConfig.draft;
  };

  // Load submission for editing
  const handleEditSubmission = (submission) => {
    setEditingSubmissionId(submission.id);
    setFormData({
      title: submission.title,
      description: submission.description,
      platform: submission.platform,
      completionDate: submission.completion_date,
      duration: submission.duration?.toString() || '',
      driveLink: submission.drive_link || '',
    });
    setCurrentStep(1);
    setShowSubmissions(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingSubmissionId(null);
    setFormData({
      title: '',
      description: '',
      platform: '',
      completionDate: '',
      duration: '',
      driveLink: '',
    });
    setCurrentStep(1);
    setShowSubmissions(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setFormData({ ...formData, files: [...formData.files, ...files] });
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    // Validate file size (10MB max per file)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setFormData({ ...formData, files: [...formData.files, ...validFiles] });
  };

  // Load submissions and stats on component mount
  useEffect(() => {
    loadSubmissions();
    loadStats();
  }, []);

  const loadSubmissions = async () => {
    try {
      const data = await cltService.getSubmissions();
      setSubmissions(data.results || data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError('Failed to load submissions. Please ensure you are logged in.');
    }
  };

  const loadStats = async () => {
    try {
      const data = await cltService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      console.error('Stats error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url
      });
      // Stats are not critical, don't show error to user
      setStats(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Starting submission...', {
        title: formData.title,
        description: formData.description,
        platform: formData.platform,
        completionDate: formData.completionDate,
        driveLink: formData.driveLink,
        editingId: editingSubmissionId
      });

      // Validate drive link is present
      if (!formData.driveLink || formData.driveLink.trim() === '') {
        throw new Error('Please provide a Google Drive link to your certificate/evidence.');
      }

      // Check if user has auth token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Prepare submission data
      const submissionData = {
        title: formData.title,
        description: formData.description,
        platform: formData.platform,
        completion_date: formData.completionDate,
        drive_link: formData.driveLink,
      };

      let createdSubmission;
      
      if (editingSubmissionId) {
        // Update existing submission
        console.log('Updating submission...', editingSubmissionId);
        createdSubmission = await cltService.updateSubmission(editingSubmissionId, submissionData);
        console.log('Submission updated:', createdSubmission);
      } else {
        // Create new submission
        console.log('Creating new submission...');
        createdSubmission = await cltService.createSubmission(submissionData);
        console.log('Submission created:', createdSubmission);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Wait a moment to show 100% progress
      setTimeout(async () => {
        try {
          // Submit the submission for review
          console.log('Submitting for review...', { submissionId: createdSubmission.id });

          await cltService.submitForReview(createdSubmission.id);
          console.log('Submitted successfully!');

          alert(editingSubmissionId ? 
            'Submission updated and sent for review!' : 
            'Submission successful! Your submission is now under review.');

          // Reset form
          setFormData({
            title: '',
            description: '',
            platform: '',
            completionDate: '',
            driveLink: ''
          });
          setCurrentStep(1);
          setUploadProgress(0);
          setIsSubmitting(false);
          setEditingSubmissionId(null);
          setShowSubmissions(true);

          // Reload data
          loadSubmissions();
          loadStats();
        } catch (submitErr) {
          console.error('Submit for review failed:', submitErr);
          console.error('Error response:', submitErr.response?.data);

          // Even if submit fails, the draft was created/updated
          const errorMsg = submitErr.response?.data?.error || submitErr.message || 'Could not submit for review';
          alert(`Draft saved but could not submit: ${errorMsg}\nYou can submit it later from your submissions list.`);
          setIsSubmitting(false);
          setEditingSubmissionId(null);
          setShowSubmissions(true);
          loadSubmissions();
          loadStats();
        }
      }, 500);

    } catch (err) {
      console.error('Submission failed:', err);
      console.error('Error details:', err.response?.data);

      let errorMessage = 'Submission failed. ';
      if (err.response?.data) {
        // Handle different error formats
        if (typeof err.response.data === 'string') {
          errorMessage += err.response.data;
        } else if (err.response.data.error) {
          errorMessage += err.response.data.error;
        } else if (err.response.data.message) {
          errorMessage += err.response.data.message;
        } else if (err.response.data.detail) {
          errorMessage += err.response.data.detail;
        } else {
          errorMessage += JSON.stringify(err.response.data);
        }
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
      setIsSubmitting(false);
      setUploadProgress(0);
      alert(errorMessage);
    }
  };

  return (
    <div className="clt-container">

      {/* Header */}
      <motion.div
        className="clt-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="clt-title">Center for Learning and Teaching</h1>
        <p className="clt-subtitle">
          Document your creative projects and learning journey
        </p>
      </motion.div>

      {/* Recent Submissions Section */}
      {showSubmissions && submissions && submissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '2rem' }}
        >
          <GlassCard variant="medium">
            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                marginBottom: '1.5rem',
                color: 'var(--text-primary)'
              }}>
                Your Submissions
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {submissions.slice(0, 5).map((submission, index) => {
                  const statusConfig = getStatusBadge(submission.status);
                  const StatusIcon = statusConfig.icon;
                  const isRecent = index === 0;
                  const canEdit = submission.status === 'draft' || submission.status === 'rejected';

                  return (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      style={{
                        padding: '1.25rem',
                        background: isRecent ? 
                          'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))' : 
                          'rgba(255, 255, 255, 0.03)',
                        border: isRecent ? 
                          '2px solid rgba(99, 102, 241, 0.3)' : 
                          '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        position: 'relative'
                      }}
                    >
                      {isRecent && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '1rem',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: '#fff',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}>
                          🏆 Most Recent
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)',
                            marginBottom: '0.5rem'
                          }}>
                            {submission.title}
                          </h3>
                          <p style={{ 
                            fontSize: '0.9rem', 
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem',
                            lineHeight: '1.4'
                          }}>
                            {submission.description.length > 120 ? 
                              `${submission.description.substring(0, 120)}...` : 
                              submission.description}
                          </p>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: statusConfig.bg,
                          borderRadius: '8px',
                          border: `1px solid ${statusConfig.color}40`,
                          marginLeft: '1rem'
                        }}>
                          <StatusIcon size={16} style={{ color: statusConfig.color }} />
                          <span style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: '600',
                            color: statusConfig.color
                          }}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span>📚 {submission.platform}</span>
                          <span>📅 {new Date(submission.completion_date).toLocaleDateString()}</span>
                          {submission.duration && <span>⏱️ {submission.duration}h</span>}
                        </div>

                        {canEdit && (
                          <Button
                            variant="outline"
                            onClick={() => handleEditSubmission(submission)}
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Edit size={14} />
                            Edit
                          </Button>
                        )}
                      </div>

                      {submission.reviewer_comments && (
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          background: 'rgba(59, 130, 246, 0.05)',
                          borderLeft: '3px solid #3b82f6',
                          borderRadius: '4px'
                        }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3b82f6', marginBottom: '0.25rem' }}>
                            Mentor's Feedback:
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {submission.reviewer_comments}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {submissions.length > 5 && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Showing 5 of {submissions.length} submissions
                  </span>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* New Submission Button */}
      {showSubmissions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginBottom: '2rem', textAlign: 'center' }}
        >
          <Button
            variant="primary"
            withGlow
            onClick={() => setShowSubmissions(false)}
            style={{ padding: '1rem 2rem', fontSize: '1rem' }}
          >
            + New Submission
          </Button>
        </motion.div>
      )}

      {/* Submission Form */}
      {!showSubmissions && (
        <>
          {editingSubmissionId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                ✏️ Editing Submission
              </span>
              <Button variant="outline" onClick={handleCancelEdit} style={{ padding: '0.5rem 1rem' }}>
                Cancel Edit
              </Button>
            </motion.div>
          )}

          )}

      {/* Step Indicators */}
      <div className="clt-steps">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <motion.div
                className={`clt-step ${isActive ? 'clt-step--active' : ''} ${isCompleted ? 'clt-step--completed' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="clt-step-icon">
                  <StepIcon size={20} />
                  {isCompleted && (
                    <motion.div
                      className="clt-step-check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <CheckCircle size={16} />
                    </motion.div>
                  )}
                </div>
                <span className="clt-step-label">{step.label}</span>
              </motion.div>

              {index < steps.length - 1 && (
                <div className="clt-step-connector">
                  <motion.div
                    className="clt-step-connector-fill"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Content */}
      <GlassCard variant="medium" className="clt-form-card">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="clt-step-content"
            >
              <h2 className="clt-form-title">Course Details</h2>

              <Input
                label="Course Title"
                placeholder="Enter course title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                floatingLabel={false}
              />

              <div className="clt-textarea-wrapper">
                <label className="clt-textarea-label">Course Description</label>
                <textarea
                  className="clt-textarea"
                  rows="5"
                  placeholder="Describe the course you had completed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <Input
                label="Platform"
                placeholder="e.g., Coursera, Udemy, edX"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                floatingLabel={false}
              />

              <Input
                label="Completion Date"
                type="date"
                placeholder="Select completion date"
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                floatingLabel={false}
              />

              <Input
                label="Total Duration (hours)"
                type="number"
                placeholder="e.g., 40"
                min="10"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                floatingLabel={false}
              />

              <div className="clt-form-actions">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (formData.title && formData.description) {
                      if (formData.duration && parseInt(formData.duration) < 10) {
                        alert('Total duration must be at least 10 hours');
                        return;
                      }
                      setCurrentStep(2);
                    } else {
                      alert('Please fill in all required fields');
                    }
                  }}
                >
                  Next Step
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="clt-step-content"
            >
              <h2 className="clt-form-title">Certificate/Evidence Link</h2>

              <p className="clt-form-description" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                Please upload your certificate or evidence to Google Drive and share the link below.
                Make sure the link is accessible to anyone with the link.
              </p>

              <Input
                label="Google Drive Link"
                placeholder="https://drive.google.com/file/d/..."
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                floatingLabel
              />

              <p className="clt-upload-hint" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                💡 Tip: Right-click your file in Google Drive → Get link → Copy link
              </p>

              <div className="clt-form-actions">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (formData.driveLink && formData.driveLink.trim() !== '') {
                      setCurrentStep(3);
                    } else {
                      alert('Please provide a Google Drive link');
                    }
                  }}
                >
                  Next Step
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="clt-step-content"
            >
              <h2 className="clt-form-title">Review & Submit</h2>

              <div className="clt-review-section">
                <h3 className="clt-review-label">Course Title</h3>
                <p className="clt-review-value">{formData.title}</p>
              </div>

              <div className="clt-review-section">
                <h3 className="clt-review-label">Description</h3>
                <p className="clt-review-value">{formData.description}</p>
              </div>

              <div className="clt-review-section">
                <h3 className="clt-review-label">Platform</h3>
                <p className="clt-review-value">{formData.platform}</p>
              </div>

              <div className="clt-review-section">
                <h3 className="clt-review-label">Completion Date</h3>
                <p className="clt-review-value">{formData.completionDate}</p>
              </div>

              <div className="clt-review-section">
                <h3 className="clt-review-label">Total Duration</h3>
                <p className="clt-review-value">{formData.duration} hours</p>
              </div>

              <div className="clt-review-section">
                <h3 className="clt-review-label">Google Drive Link</h3>
                <p className="clt-review-value" style={{ wordBreak: 'break-all' }}>{formData.driveLink}</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="clt-error-section"
                  style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#ef4444'
                  }}
                >
                  <p>{error}</p>
                </motion.div>
              )}

              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="clt-progress-section"
                >
                  <p className="clt-progress-label">Uploading your submission...</p>
                  <ProgressBar progress={uploadProgress} animated />
                </motion.div>
              )}

              <div className="clt-form-actions">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  withGlow
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Finalize Submission'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
        </>
      )}
    </div>
  );
};

export default CLT;
