import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, Heart, Trophy, Linkedin, Code, Grid, CheckCircle, Clock, XCircle, FileText, ExternalLink, Image, Link as LinkIcon, Eye, Search, Filter, X, ThumbsUp, ThumbsDown, RotateCcw, MessageSquare, Calendar, User, Mail, Phone, Target, Zap, Flame, TrendingUp, Activity } from 'lucide-react';
import { getPillarSubmissions, getPillarStats, reviewSubmission, getSubmissionType, getStudentLeetCodeProfile } from '../../services/mentorApi';
import { motion, AnimatePresence } from 'framer-motion';
import './PillarReview.css';

const PILLARS = [
    { id: 'all', name: 'All', icon: Grid, color: '#3b82f6' },
    { id: 'clt', name: 'CLT', icon: Lightbulb, color: '#f59e0b' },
    { id: 'sri', name: 'SRI', icon: Heart, color: '#ef4444' },
    { id: 'cfc', name: 'CFC', icon: Trophy, color: '#10b981' },
    { id: 'iipc', name: 'IIPC', icon: Linkedin, color: '#0ea5e9' },
    { id: 'scd', name: 'SCD', icon: Code, color: '#8b5cf6' },
];

// Animated counter hook
function useCountUp(end, duration = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
}

function PillarReview() {
    const [activePillar, setActivePillar] = useState('all');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [mentorComment, setMentorComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [actionAnimation, setActionAnimation] = useState(null);
    const [error, setError] = useState(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('pending'); // Default to showing only pending
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('latest');
    const [yearFilter, setYearFilter] = useState('all');

    // LeetCode profile modal states
    const [showLeetCodeModal, setShowLeetCodeModal] = useState(false);
    const [leetcodeData, setLeetcodeData] = useState(null);
    const [leetcodeLoading, setLeetcodeLoading] = useState(false);
    const [leetcodeError, setLeetcodeError] = useState(null);

    // Fetch submissions and stats from API
    useEffect(() => {
        let isMounted = true; // Prevent state updates if component unmounts

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            setSubmissions([]); // Clear submissions immediately when pillar changes
            
            try {
                console.log(`Fetching data for pillar: ${activePillar}`);
                
                // Fetch stats
                const statsData = await getPillarStats(activePillar);
                if (!isMounted) return;
                setStats(statsData);

                // Fetch submissions with filters
                const filters = {
                    status: statusFilter,
                    search: searchQuery,
                    year: yearFilter,
                    sort: sortOrder
                };
                const submissionsData = await getPillarSubmissions(activePillar, filters);
                console.log(`Fetched ${submissionsData.submissions?.length || 0} submissions for pillar: ${activePillar}`);
                
                if (!isMounted) return;
                setSubmissions(submissionsData.submissions || []);
            } catch (err) {
                console.error('Error fetching data:', err);
                if (!isMounted) return;
                setError(err.message || 'Failed to load data. Please try again.');
                setSubmissions([]);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();
        
        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [activePillar, statusFilter, searchQuery, yearFilter, sortOrder]);

    const getActivePillar = () => {
        return PILLARS.find(p => p.id === activePillar) || PILLARS[0];
    };

    const currentPillar = getActivePillar();

    // STRICT filtering - only show submissions that match the active pillar
    // Even though API filters, this ensures no stale state leaks through
    // Also filter out already reviewed submissions (approved/rejected) by default
    const filteredSubmissions = useMemo(() => {
        if (!Array.isArray(submissions)) return [];
        
        let filtered = submissions;
        
        // Filter by pillar
        if (activePillar !== 'all') {
            filtered = filtered.filter(sub => sub.pillar === activePillar);
        }
        
        // Filter by status - if "all" or "pending", show only submissions needing review
        if (statusFilter === 'all' || statusFilter === 'pending') {
            const needsReviewStatuses = ['pending', 'submitted', 'under_review', 'draft', 'resubmit'];
            filtered = filtered.filter(sub => needsReviewStatuses.includes(sub.status));
        } else {
            // If specific status selected (approved/rejected), show those
            filtered = filtered.filter(sub => sub.status === statusFilter);
        }
        
        return filtered;
    }, [submissions, activePillar, statusFilter]);

    // Animated counts
    const animatedTotal = useCountUp(stats.total);
    const animatedPending = useCountUp(stats.pending);
    const animatedApproved = useCountUp(stats.approved);
    const animatedRejected = useCountUp(stats.rejected);

    // Calculate completion percentage
    const completionPercentage = Math.round(((stats.approved + stats.rejected) / stats.total) * 100);

    const handleReviewClick = (submission) => {
        console.log('🔵 Review button clicked!');
        console.log('📦 Submission data:', submission);
        
        // Transform submission data to match drawer expectations
        const transformedSubmission = {
            ...submission,
            fullDescription: submission.description || submission.fullDescription || 'No description provided',
            evidence: {
                images: submission.evidence?.images || [],
                links: submission.evidence?.links || []
            },
            timeline: submission.timeline || [],
            student: {
                ...submission.student,
                avatar: submission.student?.avatar || '👤',
                rollNo: submission.student?.rollNo || submission.student?.roll || 'N/A',
                email: submission.student?.email || 'N/A',
                phone: submission.student?.phone || 'N/A'
            }
        };
        
        console.log('📦 Transformed submission:', transformedSubmission);
        setSelectedSubmission(transformedSubmission);
        setMentorComment('');
        console.log('✅ selectedSubmission set');
    };

    const closeReviewDrawer = () => {
        setSelectedSubmission(null);
        setMentorComment('');
    };

    const handleApprove = async () => {
        if (!selectedSubmission) return;

        try {
            setActionAnimation('success');
            
            const submissionType = getSubmissionType(selectedSubmission.pillar, selectedSubmission);
            
            await reviewSubmission({
                pillar: selectedSubmission.pillar,
                submission_id: selectedSubmission.dbId,
                submission_type: submissionType,
                action: 'approve',
                comment: mentorComment || 'Approved by mentor'
            });

            // Remove the approved submission from the local state immediately
            setSubmissions(prevSubmissions => 
                prevSubmissions.filter(sub => sub.id !== selectedSubmission.id)
            );

            // Refresh stats
            const statsData = await getPillarStats(activePillar);
            setStats(statsData);

            setTimeout(() => {
                setActionAnimation(null);
                closeReviewDrawer();
            }, 1500);
        } catch (error) {
            console.error('Error approving submission:', error);
            alert('Failed to approve submission: ' + error.message);
            setActionAnimation(null);
        }
    };

    const handleReject = async () => {
        if (!selectedSubmission) return;
        
        if (!mentorComment.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            setActionAnimation('warning');
            
            const submissionType = getSubmissionType(selectedSubmission.pillar, selectedSubmission);
            
            await reviewSubmission({
                pillar: selectedSubmission.pillar,
                submission_id: selectedSubmission.dbId,
                submission_type: submissionType,
                action: 'reject',
                comment: mentorComment
            });

            // Remove the rejected submission from the local state immediately
            setSubmissions(prevSubmissions => 
                prevSubmissions.filter(sub => sub.id !== selectedSubmission.id)
            );

            // Refresh stats
            const statsData = await getPillarStats(activePillar);
            setStats(statsData);

            setTimeout(() => {
                setActionAnimation(null);
                closeReviewDrawer();
            }, 1500);
        } catch (error) {
            console.error('Error rejecting submission:', error);
            alert('Failed to reject submission: ' + error.message);
            setActionAnimation(null);
        }
    };

    const handleRequestResubmission = () => {
        if (selectedSubmission && mentorComment.trim()) {
            alert('Resubmission request feature will be implemented in future update');
        } else {
            alert('Please provide feedback for resubmission');
        }
    };

    const handleViewLeetCode = async (studentId) => {
        setLeetcodeLoading(true);
        setLeetcodeError(null);
        setShowLeetCodeModal(true);
        
        try {
            const data = await getStudentLeetCodeProfile(studentId);
            setLeetcodeData(data);
        } catch (error) {
            console.error('Error fetching LeetCode profile:', error);
            setLeetcodeError(error.message || 'Failed to load LeetCode profile');
        } finally {
            setLeetcodeLoading(false);
        }
    };

    const closeLeetCodeModal = () => {
        setShowLeetCodeModal(false);
        setLeetcodeData(null);
        setLeetcodeError(null);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending':
                return { label: 'Pending', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' };
            case 'approved':
                return { label: 'Approved', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' };
            case 'rejected':
                return { label: 'Rejected', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
            default:
                return { label: status, color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    return (
        <div className="pillar-review">
            {/* Header Section */}
            <div className="pillar-review__header">
                <h1 className="pillar-review__title">Pillar Review</h1>
                <p className="pillar-review__subtitle">
                    Review all student submissions under this pillar
                </p>
            </div>

            {/* Pillar Selector Tabs */}
            <div className="pillar-review__tabs">
                {PILLARS.map((pillar) => {
                    const Icon = pillar.icon;
                    const isActive = activePillar === pillar.id;

                    return (
                        <button
                            key={pillar.id}
                            className={`pillar-review__tab ${isActive ? 'pillar-review__tab--active' : ''}`}
                            onClick={() => setActivePillar(pillar.id)}
                            style={{
                                '--pillar-color': isActive ? '#fbbf24' : pillar.color
                            }}
                        >
                            <Icon size={20} />
                            <span>{pillar.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Pillar Summary Section */}
            <div className="pillar-review__summary">
                <div className="pillar-summary-card">
                    <div className="pillar-summary-card__header">
                        <div className="pillar-summary-card__icon" style={{ color: currentPillar.color }}>
                            <currentPillar.icon size={28} />
                        </div>
                        <div className="pillar-summary-card__title">
                            <h2>{currentPillar.name} Overview</h2>
                            <p>Submission statistics and progress</p>
                        </div>
                    </div>

                    <div className="pillar-summary-card__stats">
                        <div className="stat-item">
                            <div className="stat-item__icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                                <FileText size={16} color="#3b82f6" />
                            </div>
                            <div className="stat-item__content">
                                <span className="stat-item__label">Total Submissions</span>
                                <span className="stat-item__value">{animatedTotal}</span>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-item__icon" style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
                                <Clock size={16} color="#fbbf24" />
                            </div>
                            <div className="stat-item__content">
                                <span className="stat-item__label">Pending</span>
                                <span className="stat-item__value">{animatedPending}</span>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-item__icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                <CheckCircle size={16} color="#10b981" />
                            </div>
                            <div className="stat-item__content">
                                <span className="stat-item__label">Approved</span>
                                <span className="stat-item__value">{animatedApproved}</span>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-item__icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <XCircle size={16} color="#ef4444" />
                            </div>
                            <div className="stat-item__content">
                                <span className="stat-item__label">Rejected</span>
                                <span className="stat-item__value">{animatedRejected}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pillar-summary-card__progress">
                        <div className="progress-header">
                            <span className="progress-label">Completion Rate</span>
                            <span className="progress-percentage">{completionPercentage}%</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-bar__fill"
                                style={{
                                    width: `${completionPercentage}%`,
                                    background: completionPercentage >= 75
                                        ? 'linear-gradient(90deg, #10b981, #059669)'
                                        : completionPercentage >= 50
                                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                            : 'linear-gradient(90deg, #ef4444, #dc2626)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <XCircle size={20} />
                    <div>
                        <strong>Error:</strong> {error}
                        <br />
                        <small>Please make sure you're logged in as a mentor (staff user).</small>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-bar__search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by student name or submission..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="filter-search-input"
                    />
                </div>

                <div className="filter-bar__controls">
                    <div className="filter-group">
                        <label className="filter-label">
                            <Filter size={14} />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Pending</option>
                            <option value="pending">Pending Review</option>
                            <option value="approved">Approved (History)</option>
                            <option value="rejected">Rejected (History)</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">
                            <Clock size={14} />
                            Sort By
                        </label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="filter-select"
                        >
                            <option value="latest">Latest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">
                            <Calendar size={14} />
                            Year
                        </label>
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Years</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                        </select>
                    </div>
                </div>

                <div className="filter-bar__results">
                    Showing {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Content Container */}
            <div className="pillar-review__content">
                {isLoading ? (
                    /* Loading Skeletons */
                    <div className="submissions-grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="submission-card skeleton-card">
                                <div className="skeleton-header">
                                    <div className="skeleton-avatar skeleton-animate" />
                                    <div className="skeleton-text-group">
                                        <div className="skeleton-text skeleton-text--short skeleton-animate" />
                                        <div className="skeleton-text skeleton-text--tiny skeleton-animate" />
                                    </div>
                                    <div className="skeleton-badge skeleton-animate" />
                                </div>
                                <div className="skeleton-body">
                                    <div className="skeleton-text skeleton-text--medium skeleton-animate" />
                                    <div className="skeleton-text skeleton-text--long skeleton-animate" />
                                    <div className="skeleton-text skeleton-text--long skeleton-animate" />
                                    <div className="skeleton-text skeleton-text--medium skeleton-animate" />
                                </div>
                                <div className="skeleton-footer">
                                    <div className="skeleton-text skeleton-text--tiny skeleton-animate" />
                                    <div className="skeleton-button skeleton-animate" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !filteredSubmissions || filteredSubmissions.length === 0 ? (
                    /* Enhanced Empty State */
                    <div className="empty-state">
                        <div className="empty-state__icon">
                            <FileText size={80} />
                        </div>
                        <h3 className="empty-state__title">No Submissions Found</h3>
                        <p className="empty-state__message">
                            {searchQuery.trim() || statusFilter !== 'all' || yearFilter !== 'all'
                                ? 'Try adjusting your filters to see more results.'
                                : `There are no submissions for ${currentPillar.name === 'All' ? 'any pillar' : currentPillar.name} yet.`
                            }
                        </p>
                        {(searchQuery.trim() || statusFilter !== 'all' || yearFilter !== 'all') && (
                            <button
                                className="empty-state__button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                    setYearFilter('all');
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    /* Submission Cards - STRICT: Only renders when filteredSubmissions.length > 0 */
                    <div className="submissions-grid">
                        {filteredSubmissions.map((submission) => {
                            const statusConfig = getStatusConfig(submission.status);

                            return (
                                <div
                                    key={submission.id}
                                    className={`submission-card submission-card--${submission.status}`}
                                >
                                    {/* Student Info Header */}
                                    <div className="submission-card__header">
                                        <div className="student-info">
                                            <div className="student-avatar">
                                                {submission.student.avatar}
                                            </div>
                                            <div className="student-details">
                                                <h3 className="student-name">{submission.student.name}</h3>
                                                <p className="student-meta">
                                                    {submission.student.year} • {submission.student.department}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className="status-badge"
                                            style={{
                                                color: statusConfig.color,
                                                background: statusConfig.bgColor,
                                                boxShadow: `0 0 20px ${statusConfig.bgColor}`
                                            }}
                                        >
                                            {statusConfig.label}
                                        </div>
                                    </div>

                                    {/* Submission Content */}
                                    <div className="submission-card__body">
                                        <h4 className="submission-title">{submission.title}</h4>
                                        <p className="submission-description">
                                            {submission.description}
                                        </p>
                                    </div>

                                    {/* Submission Footer */}
                                    <div className="submission-card__footer">
                                        <div className="submission-meta">
                                            <span className="submission-date">
                                                <Clock size={14} />
                                                {formatDate(submission.submittedDate)}
                                            </span>
                                            <div className="evidence-links">
                                                {submission.evidenceLinks.images > 0 && (
                                                    <span className="evidence-badge" title="Images">
                                                        <Image size={14} />
                                                        {submission.evidenceLinks.images}
                                                    </span>
                                                )}
                                                {submission.evidenceLinks.links > 0 && (
                                                    <span className="evidence-badge" title="Links">
                                                        <LinkIcon size={14} />
                                                        {submission.evidenceLinks.links}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {submission.pillar === 'scd' && (
                                                <button
                                                    className="leetcode-button"
                                                    onClick={() => handleViewLeetCode(submission.student.id)}
                                                    title="View LeetCode Streaks"
                                                >
                                                    <Flame size={16} />
                                                    View Streaks
                                                </button>
                                            )}
                                            <button
                                                className="review-button"
                                                onClick={() => handleReviewClick(submission)}
                                            >
                                                <Eye size={16} />
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Review Drawer - Rendered at component level to avoid parent blur effects */}
            {console.log('🎨 Rendering check - selectedSubmission:', selectedSubmission)}
            {selectedSubmission && (
                <div className="drawer-portal">
                    <div className="drawer-overlay" onClick={closeReviewDrawer} />
                    <div className="review-drawer">
                        {/* Action Animation Overlay */}
                        {actionAnimation && (
                            <div className={`action-animation action-animation--${actionAnimation}`}>
                                <div className="action-animation__icon">
                                    {actionAnimation === 'success' && <CheckCircle size={80} />}
                                    {actionAnimation === 'warning' && <XCircle size={80} />}
                                    {actionAnimation === 'resubmit' && <RotateCcw size={80} />}
                                </div>
                                <p className="action-animation__text">
                                    {actionAnimation === 'success' && 'Submission Approved!'}
                                    {actionAnimation === 'warning' && 'Submission Rejected'}
                                    {actionAnimation === 'resubmit' && 'Resubmission Requested'}
                                </p>
                            </div>
                        )}

                        <div className="review-drawer__header">
                            <h2>Review Submission</h2>
                            <button className="close-drawer-btn" onClick={closeReviewDrawer}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="review-drawer__content">
                            {/* Student Info Card */}
                            <div className="review-section student-info-card">
                                <div className="review-section__header">
                                    <User size={18} />
                                    <h3>Student Information</h3>
                                </div>
                                <div className="student-info-details">
                                    <div className="student-info-primary">
                                        <div className="student-avatar-large">
                                            {selectedSubmission.student.avatar}
                                        </div>
                                        <div>
                                            <h4>{selectedSubmission.student.name}</h4>
                                            <p className="student-roll">{selectedSubmission.student.rollNo}</p>
                                        </div>
                                    </div>
                                    <div className="student-info-grid">
                                        <div className="info-item">
                                            <span className="info-label">Year</span>
                                            <span className="info-value">{selectedSubmission.student.year}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Department</span>
                                            <span className="info-value">{selectedSubmission.student.department}</span>
                                        </div>
                                        <div className="info-item">
                                            <Mail size={14} />
                                            <span className="info-value">{selectedSubmission.student.email}</span>
                                        </div>
                                        <div className="info-item">
                                            <Phone size={14} />
                                            <span className="info-value">{selectedSubmission.student.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submission Details */}
                            <div className="review-section submission-details-card">
                                <div className="review-section__header">
                                    <FileText size={18} />
                                    <h3>Submission Details</h3>
                                </div>
                                <div className="submission-details-content">
                                    <div className="detail-item">
                                        <span className="detail-label">Title</span>
                                        <h4 className="detail-value">{selectedSubmission.title}</h4>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Description</span>
                                        <p className="detail-description">{selectedSubmission.fullDescription}</p>
                                    </div>
                                    <div className="detail-meta">
                                        <div className="meta-item">
                                            <Clock size={14} />
                                            <span>Submitted: {formatDate(selectedSubmission.submittedDate)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span
                                                className="status-badge-large"
                                                style={{
                                                    color: getStatusConfig(selectedSubmission.status).color,
                                                    background: getStatusConfig(selectedSubmission.status).bgColor
                                                }}
                                            >
                                                {getStatusConfig(selectedSubmission.status).label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Evidence Preview */}
                            <div className="review-section evidence-card">
                                <div className="review-section__header">
                                    <Image size={18} />
                                    <h3>Evidence</h3>
                                </div>
                                <div className="evidence-content">
                                    {selectedSubmission.evidence?.images?.length > 0 && (
                                        <div className="evidence-group">
                                            <span className="evidence-group-label">Images ({selectedSubmission.evidence.images.length})</span>
                                            <div className="evidence-items">
                                                {selectedSubmission.evidence.images.map((img, idx) => (
                                                    <div key={idx} className="evidence-item">
                                                        <Image size={16} />
                                                        <span>{img}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedSubmission.evidence?.links?.length > 0 && (
                                        <div className="evidence-group">
                                            <span className="evidence-group-label">Links ({selectedSubmission.evidence.links.length})</span>
                                            <div className="evidence-items">
                                                {selectedSubmission.evidence.links.map((link, idx) => (
                                                    <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="evidence-link">
                                                        <ExternalLink size={14} />
                                                        <span>{link}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="review-section timeline-card">
                                <div className="review-section__header">
                                    <Calendar size={18} />
                                    <h3>Submission Timeline</h3>
                                </div>
                                <div className="timeline-content">
                                    {selectedSubmission.timeline?.length > 0 ? (
                                        selectedSubmission.timeline.map((event, idx) => (
                                        <div key={idx} className={`timeline-event timeline-event--${event.type}`}>
                                            <div className="timeline-dot" />
                                            <div className="timeline-info">
                                                <span className="timeline-event-text">{event.event}</span>
                                                <span className="timeline-date">{event.date}</span>
                                            </div>
                                        </div>
                                    ))
                                    ) : (
                                        <p className="timeline-empty">No timeline events available</p>
                                    )}
                                </div>
                            </div>

                            {/* Mentor Actions */}
                            <div className="review-section mentor-actions-card">
                                <div className="review-section__header">
                                    <MessageSquare size={18} />
                                    <h3>Mentor Actions</h3>
                                </div>
                                <div className="mentor-actions-content">
                                    <div className="comment-section">
                                        <label htmlFor="mentor-comment">Comment / Feedback</label>
                                        <textarea
                                            id="mentor-comment"
                                            value={mentorComment}
                                            onChange={(e) => setMentorComment(e.target.value)}
                                            placeholder="Provide feedback or comments for the student..."
                                            rows={4}
                                            className="mentor-comment-input"
                                        />
                                    </div>
                                    <div className="action-buttons">
                                        <button
                                            className="action-btn action-btn--approve"
                                            onClick={handleApprove}
                                        >
                                            <ThumbsUp size={18} />
                                            Approve
                                        </button>
                                        <button
                                            className="action-btn action-btn--reject"
                                            onClick={handleReject}
                                        >
                                            <ThumbsDown size={18} />
                                            Reject
                                        </button>
                                        <button
                                            className="action-btn action-btn--resubmit"
                                            onClick={handleRequestResubmission}
                                        >
                                            <RotateCcw size={18} />
                                            Request Resubmission
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LeetCode Profile Modal */}
            <AnimatePresence>
                {showLeetCodeModal && (
                    <div className="drawer-portal">
                        <motion.div 
                            className="drawer-overlay" 
                            onClick={closeLeetCodeModal}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.div 
                            className="leetcode-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '90%',
                                maxWidth: '900px',
                                maxHeight: '90vh',
                                background: 'rgba(0, 0, 0, 0.95)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '20px',
                                padding: '2rem',
                                zIndex: 10000,
                                overflowY: 'auto',
                                boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)'
                            }}
                        >
                            <button
                                onClick={closeLeetCodeModal}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#fff',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <X size={20} />
                            </button>

                            <h2 style={{
                                fontSize: '1.8rem',
                                fontWeight: '700',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                color: '#fff'
                            }}>
                                <Code size={28} style={{ color: '#8b5cf6' }} />
                                LeetCode Profile
                            </h2>

                            {leetcodeLoading ? (
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    minHeight: '300px',
                                    fontSize: '1.2rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Loading profile...
                                </div>
                            ) : leetcodeError ? (
                                <div style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: '#ef4444',
                                    fontSize: '1.1rem'
                                }}>
                                    {leetcodeError}
                                </div>
                            ) : leetcodeData ? (
                                <div>
                                    {/* Student Info */}
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontSize: '2.5rem' }}>{leetcodeData.student?.avatar || '👤'}</div>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>
                                                    {leetcodeData.student?.name}
                                                </h3>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                    {leetcodeData.student?.year} • {leetcodeData.student?.department}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Username & Status */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '12px',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                LeetCode Username
                                            </div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff' }}>
                                                {leetcodeData.leetcode_username}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '0.5rem 1rem',
                                            background: leetcodeData.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                                                       leetcodeData.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' :
                                                       'rgba(251, 191, 36, 0.1)',
                                            border: `1px solid ${
                                                leetcodeData.status === 'approved' ? '#10b981' :
                                                leetcodeData.status === 'rejected' ? '#ef4444' :
                                                '#fbbf24'
                                            }`,
                                            borderRadius: '8px',
                                            color: leetcodeData.status === 'approved' ? '#10b981' :
                                                   leetcodeData.status === 'rejected' ? '#ef4444' :
                                                   '#fbbf24',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                            {leetcodeData.status?.toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Circular Progress & Stats */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1.5rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        {/* Total Problems Circle */}
                                        <div style={{
                                            padding: '2rem',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    fill="none"
                                                    stroke="rgba(139, 92, 246, 0.1)"
                                                    strokeWidth="12"
                                                />
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    fill="none"
                                                    stroke="url(#gradient)"
                                                    strokeWidth="12"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${2 * Math.PI * 70}`}
                                                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - leetcodeData.total_solved / 3773)}`}
                                                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                                                />
                                                <defs>
                                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#8b5cf6" />
                                                        <stop offset="100%" stopColor="#6366f1" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <div style={{
                                                position: 'absolute',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                                                    {leetcodeData.total_solved}
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                    Problems Solved
                                                </div>
                                            </div>
                                        </div>

                                        {/* Streak & Monthly Info */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{
                                                padding: '1.5rem',
                                                background: 'rgba(255, 107, 53, 0.1)',
                                                border: '1px solid rgba(255, 107, 53, 0.3)',
                                                borderRadius: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <Flame size={32} style={{ color: '#ff6b35', marginBottom: '0.5rem' }} />
                                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ff6b35' }}>
                                                    {leetcodeData.streak} 🔥
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    Day Streak
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '1.5rem',
                                                background: 'rgba(251, 191, 36, 0.1)',
                                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                                borderRadius: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <Target size={32} style={{ color: '#fbbf24', marginBottom: '0.5rem' }} />
                                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
                                                    {leetcodeData.monthly_problems_count}/10
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    This Month
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Difficulty Breakdown */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{
                                            padding: '1.5rem',
                                            background: 'rgba(74, 222, 128, 0.1)',
                                            border: '1px solid rgba(74, 222, 128, 0.3)',
                                            borderRadius: '12px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4ade80', marginBottom: '0.5rem' }}>
                                                {leetcodeData.easy_solved}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                Easy
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1.5rem',
                                            background: 'rgba(251, 191, 36, 0.1)',
                                            border: '1px solid rgba(251, 191, 36, 0.3)',
                                            borderRadius: '12px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24', marginBottom: '0.5rem' }}>
                                                {leetcodeData.medium_solved}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                Medium
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1.5rem',
                                            background: 'rgba(248, 113, 113, 0.1)',
                                            border: '1px solid rgba(248, 113, 113, 0.3)',
                                            borderRadius: '12px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f87171', marginBottom: '0.5rem' }}>
                                                {leetcodeData.hard_solved}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                Hard
                                            </div>
                                        </div>
                                    </div>

                                    {/* Last Synced Info */}
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        textAlign: 'center'
                                    }}>
                                        Last synced: {new Date(leetcodeData.last_synced).toLocaleString()}
                                    </div>

                                    {leetcodeData.review_comments && (
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '1rem',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#3b82f6', marginBottom: '0.5rem' }}>
                                                Mentor's Feedback:
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {leetcodeData.review_comments}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PillarReview;
