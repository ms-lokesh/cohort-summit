import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Linkedin, Link, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  FileText, Users, Send, Save, Loader2, AlertCircle,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';
import {
  getMonthlySubmission,
  saveMonthlySubmission,
  submitMonthlySubmission,
  getMonthlyHistory,
} from '../../services/iipc';
import './IIPC.css';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const POST_LABELS  = ['1st Post / Article', '2nd Post / Article', '3rd Post / Article', '4th Post / Article'];
const CONN_LABELS  = ['1st Connection', '2nd Connection', '3rd Connection', '4th Connection'];
const POST_URL_KEYS  = ['post_1_url', 'post_2_url', 'post_3_url', 'post_4_url'];
const POST_TYPE_KEYS = ['post_1_type', 'post_2_type', 'post_3_type', 'post_4_type'];
const CONN_URL_KEYS  = ['connection_1_url', 'connection_2_url', 'connection_3_url', 'connection_4_url'];

const isValidUrl = (val) => {
  try { return ['http:', 'https:'].includes(new URL(val?.trim()).protocol); }
  catch { return false; }
};

const EMPTY_FORM = {
  post_1_url: '', post_1_type: 'post',
  post_2_url: '', post_2_type: 'post',
  post_3_url: '', post_3_type: 'post',
  post_4_url: '', post_4_type: 'post',
  connection_1_url: '',
  connection_2_url: '',
  connection_3_url: '',
  connection_4_url: '',
};

function StatusBadge({ status }) {
  const map = {
    draft:    { icon: <Save size={14} />,       label: 'Draft',                  cls: 'iipc-badge--draft' },
    pending:  { icon: <Clock size={14} />,       label: 'Awaiting Mentor Review', cls: 'iipc-badge--pending' },
    approved: { icon: <CheckCircle size={14} />, label: 'Approved',               cls: 'iipc-badge--approved' },
    rejected: { icon: <XCircle size={14} />,     label: 'Revision Requested',     cls: 'iipc-badge--rejected' },
  };
  const { icon, label, cls } = map[status] || map.draft;
  return <span className={`iipc-status-badge2 ${cls}`}>{icon} {label}</span>;
}

function ProgressBar({ count, total = 4, label }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="iipc-progress-wrap">
      <div className="iipc-progress-header">
        <span className="iipc-progress-label">{label}</span>
        <span className="iipc-progress-count">{count} / {total}</span>
      </div>
      <div className="iipc-progress-track">
        <motion.div
          className={`iipc-progress-fill${count === total ? ' complete' : ''}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

export const IIPC = () => {
  const [submission, setSubmission]     = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [history, setHistory]           = useState([]);
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const postsCount = POST_URL_KEYS.filter(k => form[k]?.trim()).length;
  const connsCount = CONN_URL_KEYS.filter(k => form[k]?.trim()).length;
  const isReadOnly = submission?.status === 'pending' || submission?.status === 'approved';
  const canSubmit  = postsCount === 4 && connsCount === 4 && !isReadOnly;

  const loadSubmission = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMonthlySubmission();
      setSubmission(data);
      setForm({
        post_1_url:       data.post_1_url  || '',
        post_1_type:      data.post_1_type || 'post',
        post_2_url:       data.post_2_url  || '',
        post_2_type:      data.post_2_type || 'post',
        post_3_url:       data.post_3_url  || '',
        post_3_type:      data.post_3_type || 'post',
        post_4_url:       data.post_4_url  || '',
        post_4_type:      data.post_4_type || 'post',
        connection_1_url: data.connection_1_url || '',
        connection_2_url: data.connection_2_url || '',
        connection_3_url: data.connection_3_url || '',
        connection_4_url: data.connection_4_url || '',
      });
    } catch {
      setError('Failed to load submission. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSubmission(); }, [loadSubmission]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await saveMonthlySubmission(form);
      setSubmission(data);
      setSuccess('Saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submission?.id) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await saveMonthlySubmission(form);
      const data = await submitMonthlySubmission(submission.id);
      setSubmission(data);
      setSuccess('Submitted for mentor review! You will be notified once reviewed.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadHistory = async () => {
    if (historyLoading) return;
    setHistoryLoading(true);
    try {
      const data = await getMonthlyHistory();
      setHistory(data);
    } catch { /* silent */ } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!historyOpen && history.length === 0) loadHistory();
    setHistoryOpen(v => !v);
  };

  if (loading) {
    return (
      <div className="iipc-container iipc-loading-screen">
        <Loader2 className="iipc-spinner" size={40} />
      </div>
    );
  }

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth() + 1]} ${now.getFullYear()}`;

  return (
    <div className="iipc-container">
      {/* Header */}
      <motion.div
        className="iipc-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="iipc-title">Industry Institute Partnership Cell</h1>
        <p className="iipc-subtitle">
          Submit 4 LinkedIn posts / articles and 4 new connections every month for mentor review.
        </p>
      </motion.div>

      {/* Monthly Submission Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GlassCard className="iipc-card">

          {/* Card Header */}
          <div className="iipc-card-header">
            <div className="iipc-card-header-left">
              <Link size={28} className="iipc-card-icon" />
              <div>
                <h2 className="iipc-card-title">{monthLabel} Submission</h2>
                <p className="iipc-card-subtitle">Add your LinkedIn links below and submit for review.</p>
              </div>
            </div>
            {submission && <StatusBadge status={submission.status} />}
          </div>

          {/* Progress */}
          <div className="iipc-progress-row">
            <ProgressBar count={postsCount} label="Posts / Articles" />
            <ProgressBar count={connsCount} label="Connections" />
          </div>

          {isReadOnly && (
            <div className="iipc-readonly-notice">
              <AlertCircle size={16} />
              {submission?.status === 'pending'
                ? 'Your submission is under mentor review. You cannot edit it now.'
                : 'This submission has been approved.'}
            </div>
          )}

          {submission?.reviewer_comments && (
            <div className="iipc-reviewer-comments">
              <strong>Mentor feedback:</strong> {submission.reviewer_comments}
            </div>
          )}

          {/* Posts */}
          <div className="iipc-section-heading">
            <FileText size={18} />
            <span>LinkedIn Posts &amp; Articles</span>
            <span className="iipc-section-rule" />
          </div>

          <div className="iipc-url-grid">
            {POST_URL_KEYS.map((urlKey, i) => {
              const typeKey = POST_TYPE_KEYS[i];
              const filled  = isValidUrl(form[urlKey]);
              return (
                <div key={urlKey} className={`iipc-url-row${filled ? ' filled' : ''}`}>
                  <div className="iipc-url-label-row">
                    <span className="iipc-url-label">{POST_LABELS[i]}</span>
                    {!isReadOnly ? (
                      <div className="iipc-type-buttons small">
                        <button type="button" className={`iipc-type-btn${form[typeKey] === 'post' ? ' active' : ''}`}
                          onClick={() => setForm(f => ({ ...f, [typeKey]: 'post' }))}>Post</button>
                        <button type="button" className={`iipc-type-btn${form[typeKey] === 'article' ? ' active' : ''}`}
                          onClick={() => setForm(f => ({ ...f, [typeKey]: 'article' }))}>Article</button>
                      </div>
                    ) : (
                      <span className="iipc-type-readonly">{form[typeKey]}</span>
                    )}
                  </div>
                  <div className="iipc-url-input-wrap">
                    <Linkedin size={16} className="iipc-url-icon" />
                    <input
                      type="url"
                      className="iipc-url-input"
                      placeholder={form[typeKey] === 'article'
                        ? 'https://www.linkedin.com/pulse/...'
                        : 'https://www.linkedin.com/posts/...'}
                      value={form[urlKey]}
                      onChange={e => !isReadOnly && setForm(f => ({ ...f, [urlKey]: e.target.value }))}
                      readOnly={isReadOnly}
                    />
                    {filled && <CheckCircle size={16} className="iipc-url-check" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connections */}
          <div className="iipc-section-heading" style={{ marginTop: '1.75rem' }}>
            <Users size={18} />
            <span>New Connection Screenshots</span>
            <span className="iipc-section-rule" />
          </div>
          <p className="iipc-conn-hint">
            Paste the Google Drive link for each connection screenshot (make sure sharing is set to &ldquo;Anyone with the link&rdquo;).
          </p>

          <div className="iipc-url-grid">
            {CONN_URL_KEYS.map((urlKey, i) => {
              const filled = isValidUrl(form[urlKey]);
              return (
                <div key={urlKey} className={`iipc-url-row${filled ? ' filled' : ''}`}>
                  <div className="iipc-url-label-row">
                    <span className="iipc-url-label">{CONN_LABELS[i]}</span>
                  </div>
                  <div className="iipc-url-input-wrap">
                    <Link size={16} className="iipc-url-icon" />
                    <input
                      type="url"
                      className="iipc-url-input"
                      placeholder="https://drive.google.com/file/d/..."
                      value={form[urlKey]}
                      onChange={e => !isReadOnly && setForm(f => ({ ...f, [urlKey]: e.target.value }))}
                      readOnly={isReadOnly}
                    />
                    {filled && <CheckCircle size={16} className="iipc-url-check" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div className="iipc-error-message"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <XCircle size={16} /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div className="iipc-success-message"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CheckCircle size={16} /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
          {!isReadOnly && (
            <div className="iipc-button-group" style={{ marginTop: '1.5rem' }}>
              <Button variant="outline" onClick={handleSave} disabled={saving || submitting}>
                {saving ? <Loader2 className="iipc-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Saving…' : 'Save Draft'}
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit || saving || submitting} withGlow={canSubmit}>
                {submitting ? <Loader2 className="iipc-spin" size={18} /> : <Send size={18} />}
                {submitting ? 'Submitting…' : 'Submit for Review'}
              </Button>
            </div>
          )}

          {!canSubmit && !isReadOnly && (
            <p className="iipc-submit-hint">
              {postsCount < 4 && `${4 - postsCount} more post/article link${4 - postsCount !== 1 ? 's' : ''} needed. `}
              {connsCount < 4 && `${4 - connsCount} more connection link${4 - connsCount !== 1 ? 's' : ''} needed.`}
            </p>
          )}

        </GlassCard>
      </motion.div>

      {/* History */}
      <div className="iipc-history-section">
        <button className="iipc-history-toggle" onClick={toggleHistory}>
          <span>Past Submissions</span>
          {historyOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        <AnimatePresence>
          {historyOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              {historyLoading ? (
                <div className="iipc-history-loading"><Loader2 className="iipc-spin" size={20} /></div>
              ) : history.length === 0 ? (
                <p className="iipc-history-empty">No past submissions yet.</p>
              ) : (
                <div className="iipc-history-list">
                  {history.map(sub => (
                    <GlassCard key={sub.id} className="iipc-history-card">
                      <div className="iipc-history-row">
                        <span className="iipc-history-month">{MONTH_NAMES[sub.month]} {sub.year}</span>
                        <div className="iipc-history-counts">
                          <span><FileText size={14} /> {sub.posts_count}/4 posts</span>
                          <span><Users size={14} /> {sub.connections_count}/4 connections</span>
                        </div>
                        <StatusBadge status={sub.status} />
                      </div>
                      {sub.reviewer_comments && (
                        <p className="iipc-history-comment">
                          <strong>Feedback:</strong> {sub.reviewer_comments}
                        </p>
                      )}
                    </GlassCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IIPC;