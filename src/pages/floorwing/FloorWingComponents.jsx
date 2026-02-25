import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, X, Filter, Search, CheckCircle, Clock, AlertCircle,
    Megaphone, Calendar, Trash2, Edit, UserPlus, ArrowRight, Plus, Play, Pause, Award
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';
import { floorWingAnnouncementService } from '../../services/announcement';
import floorWingService from '../../services/floorWing';
import gamificationFloorWingAPI from '../../services/gamificationFloorWing';

// Students View Component
export function StudentsView({
    students,
    mentors,
    filter,
    onFilterChange,
    searchTerm,
    onSearchChange,
    selectedStudents,
    onToggleSelection,
    onAssign,
    onBulkAssign,
    onStudentClick,
    onAddStudent
}) {
    return (
        <motion.div
            key="students"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <GlassCard>
                <div className="section-header">
                    <h2 className="section-title">
                        <Users size={24} />
                        Student Management
                    </h2>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <motion.button 
                            className="add-student-btn"
                            onClick={onAddStudent}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Add New Student"
                        >
                            <UserPlus size={18} />
                            Add Student
                        </motion.button>
                        <motion.button 
                            className="assign-students-btn"
                            onClick={() => onFilterChange('unassigned')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowRight size={18} />
                            Assign Students
                        </motion.button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="students-controls">
                    <div className="filter-buttons">
                        <motion.button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => onFilterChange('all')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            All
                        </motion.button>
                        <motion.button
                            className={`filter-btn ${filter === 'at_risk' ? 'active' : ''}`}
                            onClick={() => onFilterChange('at_risk')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <AlertCircle size={16} />
                            At Risk
                        </motion.button>
                        <motion.button
                            className={`filter-btn ${filter === 'low_progress' ? 'active' : ''}`}
                            onClick={() => onFilterChange('low_progress')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Low Progress
                        </motion.button>
                    </div>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, roll no..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Assignment Mode Banner */}
                {filter === 'unassigned' && (
                    <div className="assignment-mode-banner">
                        <div className="banner-content">
                            <div className="banner-icon">
                                <UserPlus size={24} />
                            </div>
                            <div className="banner-text">
                                <h3>Assignment Mode</h3>
                                <p>Showing {students.length} unassigned student{students.length !== 1 ? 's' : ''}. Select students and assign them to mentors below.</p>
                            </div>
                        </div>
                        <motion.button 
                            className="exit-assignment-btn"
                            onClick={() => onFilterChange('all')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Exit
                        </motion.button>
                    </div>
                )}

                {/* Bulk Actions */}
                {selectedStudents.length > 0 && (
                    <div className="bulk-actions-bar">
                        <span>{selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected</span>
                        <select
                            className="bulk-select"
                            onChange={(e) => {
                                if (e.target.value) {
                                    onBulkAssign(parseInt(e.target.value));
                                    e.target.value = '';
                                }
                            }}
                        >
                            <option value="">Assign to mentor...</option>
                            {mentors.map(mentor => (
                                <option key={mentor.id} value={mentor.id}>
                                    {mentor.name} ({mentor.assigned_students_count || 0} students)
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Students Table */}
                {students.length > 0 ? (
                    <div className="table-container">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>
                                        <input
                                            type="checkbox"
                                            className="student-checkbox"
                                            onChange={(e) => {
                                                // Select/deselect all logic here
                                            }}
                                        />
                                    </th>
                                    <th>Student</th>
                                    <th>Mentor</th>
                                    <th style={{ width: '200px' }}>Progress</th>
                                    <th style={{ width: '100px' }}>Status</th>
                                    <th style={{ width: '150px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="student-checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => onToggleSelection(student.id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="student-info">
                                                <span className="student-name">{student.name}</span>
                                                <span className="student-email">{student.roll_no || student.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {student.assigned_mentor_name || <span className="text-muted">—</span>}
                                        </td>
                                        <td>
                                            <div className="pillar-dots">
                                                <span className={`pillar-dot ${(student.pillar_details?.cfc || 0) > 50 ? 'completed' : (student.pillar_details?.cfc || 0) > 0 ? 'partial' : 'empty'}`} title="CFC"></span>
                                                <span className={`pillar-dot ${(student.pillar_details?.clt || 0) > 50 ? 'completed' : (student.pillar_details?.clt || 0) > 0 ? 'partial' : 'empty'}`} title="CLT"></span>
                                                <span className={`pillar-dot ${(student.pillar_details?.sri || 0) > 50 ? 'completed' : (student.pillar_details?.sri || 0) > 0 ? 'partial' : 'empty'}`} title="SRI"></span>
                                                <span className={`pillar-dot ${(student.pillar_details?.iipc || 0) > 50 ? 'completed' : (student.pillar_details?.iipc || 0) > 0 ? 'partial' : 'empty'}`} title="IIPC"></span>
                                                <span className={`pillar-dot ${(student.pillar_details?.scd || 0) > 50 ? 'completed' : (student.pillar_details?.scd || 0) > 0 ? 'partial' : 'empty'}`} title="SCD"></span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${student.status || 'on_track'}`}>
                                                {student.status === 'at_risk' ? 'At Risk' :
                                                 student.status === 'moderate' ? 'Moderate' : 'On Track'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-cell">
                                                {filter === 'unassigned' ? (
                                                    <select
                                                        className="inline-mentor-select"
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                onAssign(student.id, parseInt(e.target.value));
                                                            }
                                                        }}
                                                        defaultValue=""
                                                    >
                                                        <option value="">Assign to...</option>
                                                        {mentors.map(mentor => (
                                                            <option key={mentor.id} value={mentor.id}>
                                                                {mentor.name} ({mentor.assigned_students_count || 0})
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <button
                                                        className="action-button"
                                                        onClick={() => onStudentClick(student)}
                                                    >
                                                        View
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        {filter === 'unassigned' ? (
                            <>
                                <CheckCircle size={48} style={{ color: '#4CAF50', opacity: 0.8 }} />
                                <p>All students have been assigned!</p>
                                <span className="empty-state-hint">
                                    Great work! All students on your floor have mentors assigned.
                                </span>
                            </>
                        ) : (
                            <>
                                <Users size={48} opacity={0.5} />
                                <p>No students found</p>
                                <span className="empty-state-hint">
                                    {filter !== 'all' ? 'Try changing your filter' : 'Students will appear here once assigned to your floor'}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </GlassCard>
        </motion.div>
    );
}

// Mentors View Component
export function MentorsView({ mentors, onAddMentor }) {
    return (
        <motion.div
            key="mentors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <GlassCard>
                <div className="section-header">
                    <h2 className="section-title">
                        <CheckCircle size={24} />
                        Mentor Management
                    </h2>
                    {onAddMentor && (
                        <motion.button 
                            className="add-mentor-btn"
                            onClick={onAddMentor}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Add New Mentor"
                        >
                            <UserPlus size={18} />
                            Add Mentor
                        </motion.button>
                    )}
                </div>
                {mentors && mentors.length > 0 ? (
                    <div className="mentors-grid">
                        {mentors.map((mentor, index) => (
                            <motion.div 
                                key={mentor.id} 
                                className="mentor-card-detailed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="mentor-card-header">
                                    <div>
                                        <h3>{mentor.name}</h3>
                                        <p className="mentor-email">{mentor.email}</p>
                                    </div>
                                    <span className={`workload-badge ${mentor.workload_status || 'balanced'}`}>
                                        {mentor.workload_status === 'low' ? 'Low' :
                                         mentor.workload_status === 'overloaded' ? 'Overloaded' : 'Balanced'}
                                    </span>
                                </div>
                                <div className="mentor-card-stats">
                                    <div className="stat-item">
                                        <Users size={20} />
                                        <div>
                                            <strong>{mentor.assigned_students_count || 0}</strong>
                                            <span>Students</span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <Clock size={20} />
                                        <div>
                                            <strong>{mentor.pending_reviews || 0}</strong>
                                            <span>Pending</span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <CheckCircle size={20} />
                                        <div>
                                            <strong>{mentor.approval_rate || 0}%</strong>
                                            <span>Approved</span>
                                        </div>
                                    </div>
                                </div>
                                {mentor.last_active && (
                                    <div className="last-active">
                                        Last active: {new Date(mentor.last_active).toLocaleDateString()}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <CheckCircle size={48} opacity={0.5} />
                        <p>No mentors assigned</p>
                        <span className="empty-state-hint">
                            Mentor information will appear here once mentors are assigned to this floor
                        </span>
                    </div>
                )}
            </GlassCard>
        </motion.div>
    );
}

// Announcements View Component
export function AnnouncementsView({ announcements, onRefresh, onCreate }) {
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            try {
                await floorWingAnnouncementService.deleteAnnouncement(id);
                onRefresh();
            } catch (error) {
                console.error('Failed to delete:', error);
                alert('Failed to delete announcement');
            }
        }
    };

    return (
        <motion.div
            key="announcements"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <GlassCard>
                <div className="section-header">
                    <h2 className="section-title">
                        <Megaphone size={24} />
                        Floor Announcements
                    </h2>
                    <motion.button 
                        className="create-announcement-btn" 
                        onClick={onCreate}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Megaphone size={18} />
                        New Announcement
                    </motion.button>
                </div>

                {announcements && announcements.length > 0 ? (
                    <div className="announcements-list">
                        {announcements.map((announcement, index) => (
                            <motion.div 
                                key={announcement.id} 
                                className={`announcement-card priority-${announcement.priority}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="announcement-header">
                                    <div className="announcement-title-section">
                                        <h3 className="announcement-title">{announcement.title}</h3>
                                        <div className="announcement-meta">
                                            <span className={`priority-badge ${announcement.priority}`}>
                                                {announcement.priority === 'urgent' ? '🔴 Urgent' :
                                                 announcement.priority === 'important' ? '🟠 Important' : '🔵 Normal'}
                                            </span>
                                            <span className="announcement-date">
                                                <Calendar size={14} />
                                                {new Date(announcement.created_at).toLocaleDateString()}
                                            </span>
                                            {announcement.expires_at && (
                                                <span className="expiry-date">
                                                    Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="announcement-actions">
                                        <button
                                            className="icon-btn delete"
                                            onClick={() => handleDelete(announcement.id)}
                                            title="Delete announcement"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="announcement-message">{announcement.message}</p>
                                <div className="announcement-footer">
                                    <span className="read-status">
                                        📖 Read by: {announcement.read_count || 0} students
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Megaphone size={48} opacity={0.5} />
                        <p>No announcements yet</p>
                        <span className="empty-state-hint">
                            Create your first announcement to communicate with students on this floor
                        </span>
                        <button className="empty-state-action" onClick={onCreate}>
                            Create Announcement
                        </button>
                    </div>
                )}
            </GlassCard>
        </motion.div>
    );
}

// Student Detail Drawer Component
export function StudentDetailDrawer({ student, mentors, onClose, onAssign }) {
    const [selectedMentor, setSelectedMentor] = React.useState('');


    return (
        <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="drawer-content"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="drawer-header">
                    <div>
                        <h2>{student.name}</h2>
                        <p>{student.email}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="drawer-body">
                    {/* Student Details */}
                    <section className="drawer-section">
                        <h3>Student Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Roll No</label>
                                <span>{student.roll_no}</span>
                            </div>
                            <div className="info-item">
                                <label>Current Mentor</label>
                                <span>{student.assigned_mentor_name || 'Not Assigned'}</span>
                            </div>
                            <div className="info-item">
                                <label>Overall Progress</label>
                                <span>{student.pillar_progress || 0}%</span>
                            </div>
                            <div className="info-item">
                                <label>Status</label>
                                <span className={`status-badge ${student.status}`}>
                                    {student.status === 'on_track' ? 'On Track' : student.status}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Pillar Progress */}
                    {student.pillar_details && (
                        <section className="drawer-section">
                            <h3>Pillar Progress</h3>
                            {Object.entries(student.pillar_details).map(([pillar, progress]) => (
                                <div key={pillar} className="pillar-progress-item">
                                    <span>{pillar.toUpperCase()}</span>
                                    <div className="progress-bar-small">
                                        <div
                                            className="progress-fill-small"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span>{progress}%</span>
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Reassign Mentor */}
                    <section className="drawer-section">
                        <h3>Reassign Mentor</h3>
                        <select
                            className="mentor-select"
                            value={selectedMentor}
                            onChange={(e) => setSelectedMentor(e.target.value)}
                        >
                            <option value="">Select a mentor...</option>
                            {mentors.map(mentor => (
                                <option key={mentor.id} value={mentor.id}>
                                    {mentor.name} ({mentor.assigned_students_count || 0} students)
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="primary"
                            style={{ width: '100%' }}
                            disabled={!selectedMentor}
                            onClick={() => {
                                if (selectedMentor) {
                                    onAssign(student.id, parseInt(selectedMentor));
                                    onClose();
                                }
                            }}
                        >
                            Assign Mentor
                        </Button>
                    </section>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Announcement Modal Component
export function AnnouncementModal({ form, onChange, onSubmit, onClose }) {
    const handleChange = (field, value) => {
        onChange({ ...form, [field]: value });
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2><Megaphone size={24} /> Create Announcement</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Announcement title"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Message *</label>
                        <textarea
                            value={form.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            placeholder="Write your announcement here..."
                            rows={6}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                value={form.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                            >
                                <option value="normal">Normal</option>
                                <option value="important">Important</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                <option value="published">Publish Now</option>
                                <option value="draft">Save as Draft</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Expires At (Optional)</label>
                        <input
                            type="datetime-local"
                            value={form.expires_at}
                            onChange={(e) => handleChange('expires_at', e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {form.status === 'draft' ? 'Save Draft' : 'Publish Announcement'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Add Student Modal Component
export function AddStudentModal({ mentors, onSubmit, onClose }) {
    const [form, setForm] = React.useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: 'student@123',
        mentor_id: ''
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError(''); // Clear error on change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!form.username || !form.email) {
            setError('Username and email are required');
            return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            await onSubmit(form);
            // Form will be closed by parent component on success
        } catch (err) {
            setError(err.message || 'Failed to add student');
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal-content add-student-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <h2>
                            <UserPlus size={24} />
                            Add New Student
                        </h2>
                        <p>Create a new student account and optionally assign to a mentor</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}
                    
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Username / Roll No <span className="required">*</span></label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                                placeholder="e.g., 21BCE1234"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email <span className="required">*</span></label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="student@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={(e) => handleChange('first_name', e.target.value)}
                                placeholder="John"
                            />
                        </div>

                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={(e) => handleChange('last_name', e.target.value)}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Default Password</label>
                        <input
                            type="text"
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="student@123"
                        />
                        <small className="help-text">Student can change this after first login</small>
                    </div>

                    <div className="form-group">
                        <label>Assign to Mentor (Optional)</label>
                        <select
                            value={form.mentor_id}
                            onChange={(e) => handleChange('mentor_id', e.target.value)}
                        >
                            <option value="">-- Select Mentor (optional) --</option>
                            {mentors.map(mentor => (
                                <option key={mentor.id} value={mentor.id}>
                                    {mentor.name} ({mentor.assigned_students_count || 0} students)
                                </option>
                            ))}
                        </select>
                        <small className="help-text">You can assign a mentor later if needed</small>
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Student'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Add Mentor Modal Component for Floor Wings
export function AddMentorModal({ isOpen, onClose, onSuccess }) {
    const [form, setForm] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: 'mentor@123'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setForm({
                username: '',
                email: '',
                first_name: '',
                last_name: '',
                password: 'mentor@123'
            });
            setErrors({});
        }
    }, [isOpen]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (!form.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await floorWingService.addMentor(form);
            
            if (onSuccess) {
                await onSuccess();
            }
            
            onClose();
        } catch (error) {
            console.error('Error adding mentor:', error);
            if (error.response?.data) {
                setErrors({
                    general: error.response.data.error || 'Failed to add mentor. Please try again.'
                });
            } else {
                setErrors({
                    general: 'Network error. Please check your connection and try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay add-mentor-modal"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Add New Mentor</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {errors.general && (
                        <div className="error-message general-error">
                            {errors.general}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Username *</label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            placeholder="Enter username"
                            className={errors.username ? 'error' : ''}
                        />
                        {errors.username && <span className="error-text">{errors.username}</span>}
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="mentor@example.com"
                            className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            value={form.first_name}
                            onChange={(e) => handleChange('first_name', e.target.value)}
                            placeholder="Enter first name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            value={form.last_name}
                            onChange={(e) => handleChange('last_name', e.target.value)}
                            placeholder="Enter last name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="text"
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="mentor@123"
                        />
                        <small className="help-text">Mentor can change this after first login</small>
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Mentor'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Gamification Management View Component
export function GamificationManagementView() {
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSeasonModal, setShowSeasonModal] = useState(false);
    const [editingSeason, setEditingSeason] = useState(null);
    const [showEpisodeModal, setShowEpisodeModal] = useState(false);
    const [selectedSeasonForEpisodes, setSelectedSeasonForEpisodes] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [editingEpisode, setEditingEpisode] = useState(null);

    useEffect(() => {
        loadSeasons();
    }, []);

    const loadSeasons = async () => {
        try {
            setLoading(true);
            const response = await gamificationFloorWingAPI.getSeasons();
            console.log('Seasons response:', response);
            // Backend returns {seasons: [...]}
            const seasonsData = response.data?.seasons || [];
            console.log('Seasons data:', seasonsData);
            setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
        } catch (error) {
            console.error('Failed to load seasons:', error);
            setSeasons([]); // Ensure it's always an array
        } finally {
            setLoading(false);
        }
    };

    const loadEpisodesForSeason = async (seasonId) => {
        try {
            const response = await gamificationFloorWingAPI.getEpisodes(seasonId);
            // Backend returns {episodes: [...]}
            const episodesData = response.data?.episodes || [];
            setEpisodes(Array.isArray(episodesData) ? episodesData : []);
            setSelectedSeasonForEpisodes(seasonId);
        } catch (error) {
            console.error('Failed to load episodes:', error);
            setEpisodes([]);
        }
    };

    const handleDeleteSeason = async (seasonId) => {
        if (!window.confirm('Are you sure you want to delete this season? This will also delete all associated episodes.')) {
            return;
        }
        try {
            await gamificationFloorWingAPI.deleteSeason(seasonId);
            await loadSeasons();
            if (selectedSeasonForEpisodes === seasonId) {
                setSelectedSeasonForEpisodes(null);
                setEpisodes([]);
            }
        } catch (error) {
            console.error('Failed to delete season:', error);
            alert('Failed to delete season. It may have associated data.');
        }
    };

    const handleDeleteEpisode = async (episodeId) => {
        if (!window.confirm('Are you sure you want to delete this episode?')) {
            return;
        }
        try {
            await gamificationFloorWingAPI.deleteEpisode(episodeId);
            if (selectedSeasonForEpisodes) {
                await loadEpisodesForSeason(selectedSeasonForEpisodes);
            }
        } catch (error) {
            console.error('Failed to delete episode:', error);
            alert('Failed to delete episode.');
        }
    };

    if (loading) {
        return (
            <motion.div
                key="gamification"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="gamification-management"
            >
                <GlassCard>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading seasons...</p>
                    </div>
                </GlassCard>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="gamification"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gamification-management"
        >
            <GlassCard>
                <div className="section-header">
                    <h2 className="section-title">
                        <Award size={24} />
                        Season Management
                    </h2>
                    <Button
                        onClick={() => {
                            setEditingSeason(null);
                            setShowSeasonModal(true);
                        }}
                        variant="primary"
                    >
                        <Plus size={18} />
                        Create Season
                    </Button>
                </div>

                <div className="seasons-list">
                    {seasons.length === 0 ? (
                        <div className="empty-state">
                            <Award size={48} style={{ opacity: 0.3 }} />
                            <p>No seasons created yet</p>
                            <Button onClick={() => setShowSeasonModal(true)} variant="primary">
                                Create First Season
                            </Button>
                        </div>
                    ) : (
                        <div className="seasons-grid">
                            {seasons.map((season) => (
                                <motion.div
                                    key={season.id}
                                    className={`season-card ${season.is_active ? 'active' : ''}`}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => loadEpisodesForSeason(season.id)}
                                >
                                    <div className="season-header">
                                        <div>
                                            <h3>{season.name}</h3>
                                            <span className="season-number">Season {season.season_number}</span>
                                        </div>
                                        {season.is_active && (
                                            <span className="active-badge">
                                                <Play size={14} />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="season-dates">
                                        <Calendar size={14} />
                                        {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                                    </div>
                                    <div className="season-actions">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingSeason(season);
                                                setShowSeasonModal(true);
                                            }}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            <Edit size={14} />
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSeason(season.id);
                                            }}
                                            variant="danger"
                                            size="sm"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </GlassCard>

            {selectedSeasonForEpisodes && (
                <GlassCard style={{ marginTop: '2rem' }}>
                    <div className="section-header">
                        <h2 className="section-title">
                            <Calendar size={24} />
                            Episodes for {seasons.find(s => s.id === selectedSeasonForEpisodes)?.name}
                        </h2>
                        <Button
                            onClick={() => {
                                setEditingEpisode(null);
                                setShowEpisodeModal(true);
                            }}
                            variant="primary"
                        >
                            <Plus size={18} />
                            Create Episode
                        </Button>
                    </div>

                    <div className="episodes-list">
                        {episodes.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={48} style={{ opacity: 0.3 }} />
                                <p>No episodes created yet</p>
                                <Button onClick={() => setShowEpisodeModal(true)} variant="primary">
                                    Create First Episode
                                </Button>
                            </div>
                        ) : (
                            <div className="episodes-grid">
                                {episodes.map((episode) => (
                                    <motion.div
                                        key={episode.id}
                                        className="episode-card"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="episode-header">
                                            <h4>Episode {episode.episode_number}</h4>
                                            <span className="episode-name">{episode.name}</span>
                                        </div>
                                        {episode.description && (
                                            <p className="episode-description">{episode.description}</p>
                                        )}
                                        <div className="episode-dates">
                                            <Calendar size={14} />
                                            {new Date(episode.start_date).toLocaleDateString()} - {new Date(episode.end_date).toLocaleDateString()}
                                        </div>
                                        <div className="episode-actions">
                                            <Button
                                                onClick={() => {
                                                    setEditingEpisode(episode);
                                                    setShowEpisodeModal(true);
                                                }}
                                                variant="secondary"
                                                size="sm"
                                            >
                                                <Edit size={14} />
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteEpisode(episode.id)}
                                                variant="danger"
                                                size="sm"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {showSeasonModal && (
                <SeasonModal
                    season={editingSeason}
                    onClose={() => {
                        setShowSeasonModal(false);
                        setEditingSeason(null);
                    }}
                    onSuccess={() => {
                        setShowSeasonModal(false);
                        setEditingSeason(null);
                        loadSeasons();
                    }}
                />
            )}

            {showEpisodeModal && selectedSeasonForEpisodes && (
                <EpisodeModal
                    episode={editingEpisode}
                    seasonId={selectedSeasonForEpisodes}
                    onClose={() => {
                        setShowEpisodeModal(false);
                        setEditingEpisode(null);
                    }}
                    onSuccess={() => {
                        setShowEpisodeModal(false);
                        setEditingEpisode(null);
                        loadEpisodesForSeason(selectedSeasonForEpisodes);
                    }}
                />
            )}
        </motion.div>
    );
}

// Season Modal Component
function SeasonModal({ season, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: season?.name || '',
        season_number: season?.season_number || '',
        start_date: season?.start_date || '',
        end_date: season?.end_date || '',
        is_active: season?.is_active || false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Ensure season_number is an integer
            const submitData = {
                ...formData,
                season_number: parseInt(formData.season_number, 10)
            };
            
            console.log('Submitting season data:', submitData);
            
            if (season) {
                await gamificationFloorWingAPI.updateSeason(season.id, submitData);
            } else {
                await gamificationFloorWingAPI.createSeason(submitData);
            }
            onSuccess();
        } catch (err) {
            console.error('Season save error:', err);
            console.error('Error response:', err.response?.data);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save season';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{season ? 'Edit Season' : 'Create Season'}</h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Season Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Winter 2024"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Season Number</label>
                        <input
                            type="number"
                            value={formData.season_number}
                            onChange={(e) => setFormData({ ...formData, season_number: e.target.value })}
                            placeholder="e.g., 1"
                            min="1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <span>Set as Active Season</span>
                        </label>
                        <small className="help-text">Only one season can be active at a time</small>
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Saving...' : season ? 'Update Season' : 'Create Season'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Episode Modal Component
function EpisodeModal({ episode, seasonId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        episode_number: episode?.episode_number || '',
        name: episode?.name || '',
        description: episode?.description || '',
        start_date: episode?.start_date || '',
        end_date: episode?.end_date || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Ensure episode_number is an integer
            const submitData = {
                ...formData,
                episode_number: parseInt(formData.episode_number, 10)
            };
            
            console.log('Submitting episode data:', submitData);
            
            if (episode) {
                await gamificationFloorWingAPI.updateEpisode(episode.id, submitData);
            } else {
                await gamificationFloorWingAPI.createEpisode(seasonId, submitData);
            }
            onSuccess();
        } catch (err) {
            console.error('Episode save error:', err);
            console.error('Error response:', err.response?.data);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save episode';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{episode ? 'Edit Episode' : 'Create Episode'}</h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Episode Number (1-4)</label>
                        <input
                            type="number"
                            value={formData.episode_number}
                            onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })}
                            placeholder="e.g., 1"
                            min="1"
                            max="4"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Episode Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Week 1 Challenge"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Episode description..."
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Saving...' : episode ? 'Update Episode' : 'Create Episode'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
