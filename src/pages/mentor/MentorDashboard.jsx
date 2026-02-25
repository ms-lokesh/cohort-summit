import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, Clock, XCircle, Lightbulb, Heart, Trophy, Linkedin, Code, Search, MessageCircle, Send, X as CloseIcon, RefreshCw, Flame, Target, Zap, TrendingUp, Activity } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';
import MentorGamificationPanel from '../../components/MentorGamificationPanel';
import messageService from '../../services/messageService';
import { getMentorStudents } from '../../services/mentor';
import { getStudentLeetCodeProfile } from '../../services/mentorApi';
import SubmissionReview from './SubmissionReview';
import './MentorDashboard.css';

function MentorDashboard() {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showChatModal, setShowChatModal] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('general');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // LeetCode modal states
    const [showLeetCodeModal, setShowLeetCodeModal] = useState(false);
    const [leetcodeData, setLeetcodeData] = useState(null);
    const [leetcodeLoading, setLeetcodeLoading] = useState(false);
    const [leetcodeError, setLeetcodeError] = useState(null);

    // Fetch students on mount
    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getMentorStudents();
            console.log('Fetched students:', data);
            setStudents(data.students || []);
        } catch (err) {
            console.error('Error loading students:', err);
            setError('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewLeetCode = async (studentId, e) => {
        e.stopPropagation(); // Prevent student card selection
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

    const formatLastSubmission = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString();
    };

    // Update submissions with formatted timestamps
    const studentsWithFormattedDates = students.map(student => ({
        ...student,
        submissions: Object.entries(student.submissions).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: {
                ...value,
                lastSubmission: formatLastSubmission(value.lastSubmission)
            }
        }), {})
    }));

    const filteredStudents = studentsWithFormattedDates.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="mentor-dashboard">
            {/* Header */}
            <motion.div
                className="mentor-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="mentor-title">Student Dashboard</h1>
                <p className="mentor-subtitle">Monitor and review your students' progress</p>
                <Button 
                    onClick={loadStudents} 
                    disabled={loading}
                    className="refresh-button"
                >
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                    Refresh
                </Button>
            </motion.div>

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={48} className="spinning" style={{ marginBottom: '1rem' }} />
                    <p>Loading students...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <GlassCard>
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                        <p>{error}</p>
                        <Button onClick={loadStudents} style={{ marginTop: '1rem' }}>Try Again</Button>
                    </div>
                </GlassCard>
            )}

            {/* Main Content */}
            {!loading && !error && (
                <>
                    {/* Gamification Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <MentorGamificationPanel />
                    </motion.div>

                    {/* Two Column Layout */}
                    <div className="mentor-content">
                {/* Left Side - Student List */}
                <motion.div
                    className="students-panel"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <GlassCard>
                        <div className="students-section">
                            <div className="students-header">
                                <h2 className="section-title">
                                    <Users size={24} />
                                    Assigned Students ({students.length})
                                </h2>
                                <div className="search-box">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>
                            <div className="students-list">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className={`student-card ${selectedStudent?.id === student.id ? 'active' : ''}`}
                                        onClick={() => setSelectedStudent(student)}
                                    >
                                        <div className="student-info">
                                            <h3 className="student-name">{student.name || 'Unknown Student'}</h3>
                                            <p className="student-roll">{student.rollNo || student.roll_no || 'N/A'}</p>
                                            <p className="student-email">{student.email || 'No email'}</p>
                                        </div>
                                        <div className="student-actions">
                                            <button
                                                className="leetcode-mini-button"
                                                onClick={(e) => handleViewLeetCode(student.id, e)}
                                                title="View LeetCode Profile"
                                            >
                                                <Flame size={16} />
                                                LeetCode
                                            </button>
                                        </div>
                                        <div className="student-status-summary">
                                            {student.submissions && Object.values(student.submissions).filter(s => s.status === 'pending').length > 0 && (
                                                <span className="pending-badge">
                                                    {Object.values(student.submissions).filter(s => s.status === 'pending').length} Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Right Side - Student Details */}
                <motion.div
                    className="details-panel"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {selectedStudent ? (
                        <SubmissionReview selectedStudent={selectedStudent} />
                    ) : (
                        <GlassCard>
                            <div className="no-selection">
                                <Users size={64} opacity={0.3} />
                                <h3>Select a Student</h3>
                                <p>Click on a student from the list to view their submission details</p>
                            </div>
                        </GlassCard>
                    )}
                </motion.div>
            </div>

            {/* Chat Modal */}
            <AnimatePresence>
                {showChatModal && selectedStudent && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowChatModal(false)}
                    >
                        <motion.div
                            className="chat-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="chat-modal-header">
                                <div>
                                    <h3>Send Message</h3>
                                    <p>To: {selectedStudent.name}</p>
                                </div>
                                <button
                                    className="close-button"
                                    onClick={() => setShowChatModal(false)}
                                >
                                    <CloseIcon size={20} />
                                </button>
                            </div>

                            <div className="chat-modal-body">
                                <div className="message-type-selector">
                                    <label className="type-label">Message Type:</label>
                                    <div className="type-options">
                                        <label className={`type-option ${messageType === 'general' ? 'active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="messageType"
                                                value="general"
                                                checked={messageType === 'general'}
                                                onChange={(e) => setMessageType(e.target.value)}
                                            />
                                            <span>General</span>
                                        </label>
                                        <label className={`type-option ${messageType === 'completion' ? 'active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="messageType"
                                                value="completion"
                                                checked={messageType === 'completion'}
                                                onChange={(e) => setMessageType(e.target.value)}
                                            />
                                            <span>Completion</span>
                                        </label>
                                        <label className={`type-option ${messageType === 'pending' ? 'active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="messageType"
                                                value="pending"
                                                checked={messageType === 'pending'}
                                                onChange={(e) => setMessageType(e.target.value)}
                                            />
                                            <span>Pending Review</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="message-input-container">
                                    <label className="input-label">Message:</label>
                                    <textarea
                                        className="message-textarea"
                                        placeholder="Type your message here..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={6}
                                    />
                                </div>
                            </div>

                            <div className="chat-modal-footer">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowChatModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={async () => {
                                        if (message.trim()) {
                                            try {
                                                await messageService.sendMessage(
                                                    selectedStudent.id,
                                                    message,
                                                    messageType
                                                );
                                                // Show success feedback
                                                alert('Message sent successfully!');
                                                setMessage('');
                                                setMessageType('general');
                                                setShowChatModal(false);
                                            } catch (error) {
                                                console.error('Failed to send message:', error);
                                                alert('Failed to send message. Please try again.');
                                            }
                                        }
                                    }}
                                    disabled={!message.trim()}
                                >
                                    <Send size={16} />
                                    <span>Send</span>
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LeetCode Profile Modal */}
            <AnimatePresence>
                {showLeetCodeModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLeetCodeModal}
                    >
                        <motion.div
                            className="leetcode-modal"
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="chat-modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Code size={28} style={{ color: '#8b5cf6' }} />
                                    <div>
                                        <h3>LeetCode Profile</h3>
                                        {leetcodeData && <p>{leetcodeData.student?.name}</p>}
                                    </div>
                                </div>
                                <button className="close-button" onClick={closeLeetCodeModal}>
                                    <CloseIcon size={20} />
                                </button>
                            </div>

                            <div className="chat-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {leetcodeLoading ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        <RefreshCw size={48} className="spinning" style={{ marginBottom: '1rem' }} />
                                        <p>Loading LeetCode profile...</p>
                                    </div>
                                ) : leetcodeError ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                                        <p>{leetcodeError}</p>
                                    </div>
                                ) : leetcodeData ? (
                                    <div>
                                        {/* Username & Status */}
                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            borderRadius: '12px',
                                            marginBottom: '1.5rem'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                LeetCode Username
                                            </div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff' }}>
                                                {leetcodeData.leetcode_username}
                                            </div>
                                        </div>

                                        {/* Monthly Stats Card - Highlighted */}
                                        <div style={{
                                            padding: '1.5rem',
                                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))',
                                            border: '2px solid rgba(251, 191, 36, 0.4)',
                                            borderRadius: '12px',
                                            marginBottom: '1.5rem'
                                        }}>
                                            <h3 style={{
                                                fontSize: '1.2rem',
                                                fontWeight: '700',
                                                color: '#fbbf24',
                                                marginBottom: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <Target size={24} />
                                                {leetcodeData.current_month} Stats
                                            </h3>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
                                                        {leetcodeData.monthly_stats?.total || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        Total Solved
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
                                                        {leetcodeData.monthly_stats?.days_active || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        Active Days
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4ade80' }}>
                                                        {leetcodeData.monthly_stats?.easy || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Easy</div>
                                                </div>
                                                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fbbf24' }}>
                                                        {leetcodeData.monthly_stats?.medium || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Medium</div>
                                                </div>
                                                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f87171' }}>
                                                        {leetcodeData.monthly_stats?.hard || 0}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hard</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Overall Stats */}
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                            Overall Statistics
                                        </h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
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
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Day Streak</div>
                                            </div>

                                            <div style={{
                                                padding: '1.5rem',
                                                background: 'rgba(139, 92, 246, 0.1)',
                                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                                borderRadius: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <TrendingUp size={32} style={{ color: '#8b5cf6', marginBottom: '0.5rem' }} />
                                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
                                                    {leetcodeData.total_solved}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Solved</div>
                                            </div>
                                        </div>

                                        {/* Difficulty Breakdown */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
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
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Easy</div>
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
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Medium</div>
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
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hard</div>
                                            </div>
                                        </div>

                                        {/* Last Synced */}
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
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
                </>
            )}
        </div>
    );
}

export default MentorDashboard;
