import api from './api';

/**
 * SRI (Social Responsibility Initiatives) API Service
 * Handles all API calls for SRI submissions and statistics
 */

const SRI_BASE = '/sri/submissions/';

export const sriService = {
  /**
   * Get all submissions for the current user
   * @param {Object} params - Query parameters (page, page_size, etc.)
   * @returns {Promise} - Paginated list of submissions
   */
  getSubmissions: async (params = {}) => {
    const response = await api.get(SRI_BASE, { params });
    return response.data;
  },

  /**
   * Get user's own submissions
   * @returns {Promise} - List of user's submissions
   */
  getMySubmissions: async () => {
    const response = await api.get(`${SRI_BASE}my-submissions/`);
    return response.data;
  },

  /**
   * Get a specific submission by ID
   * @param {number} id - Submission ID
   * @returns {Promise} - Submission details with files
   */
  getSubmission: async (id) => {
    const response = await api.get(`${SRI_BASE}${id}/`);
    return response.data;
  },

  /**
   * Create a new SRI submission
   * @param {Object} data - Submission data
   * @param {string} data.activity_title - Activity title
   * @param {string} data.activity_type - Type of activity (environment, community, etc.)
   * @param {string} data.activity_date - Date of activity (YYYY-MM-DD)
   * @param {number} data.activity_hours - Hours spent on activity
   * @param {number} data.people_helped - Number of people impacted (optional)
   * @param {string} data.description - Activity description
   * @param {string} data.personal_reflection - Personal reflection (max 500 chars)
   * @param {string} data.photo_drive_link - Google Drive link to photos
   * @param {string} data.organization_name - Organization name (optional)
   * @param {string} data.certificate_drive_link - Certificate link (optional)
   * @param {string} data.status - Submission status (draft/submitted)
   * @returns {Promise} - Created submission
   */
  createSubmission: async (data) => {
    console.log('SRI createSubmission called with:', data);
    const response = await api.post(SRI_BASE, data);
    console.log('Server response:', response.data);
    return response.data;
  },

  /**
   * Update an existing submission
   * @param {number} id - Submission ID
   * @param {Object} data - Updated submission data
   * @returns {Promise} - Updated submission
   */
  updateSubmission: async (id, data) => {
    const response = await api.patch(`${SRI_BASE}${id}/`, data);
    return response.data;
  },

  /**
   * Delete a submission
   * @param {number} id - Submission ID
   * @returns {Promise}
   */
  deleteSubmission: async (id) => {
    const response = await api.delete(`${SRI_BASE}${id}/`);
    return response.data;
  },

  /**
   * Submit a draft for review
   * @param {number} id - Submission ID
   * @returns {Promise} - Updated submission
   */
  submitForReview: async (id) => {
    const response = await api.post(`${SRI_BASE}${id}/submit/`);
    return response.data;
  },

  /**
   * Review a submission (mentor only)
   * @param {number} id - Submission ID
   * @param {string} decision - 'approve' or 'reject'
   * @param {string} comments - Reviewer comments
   * @returns {Promise} - Updated submission
   */
  reviewSubmission: async (id, decision, comments = '') => {
    const response = await api.post(`${SRI_BASE}${id}/review/`, {
      decision,
      comments
    });
    return response.data;
  },

  /**
   * Get submissions pending review (mentor only)
   * @returns {Promise} - List of pending submissions
   */
  getPendingReviews: async () => {
    const response = await api.get(`${SRI_BASE}pending-review/`);
    return response.data;
  },

  /**
   * Get user's SRI statistics
   * @returns {Promise} - Statistics object
   */
  getStats: async () => {
    const response = await api.get(`${SRI_BASE}stats/`);
    return response.data;
  },

  /**
   * Get monthly quota status
   * @returns {Promise} - Quota status object
   */
  getMonthlyQuota: async () => {
    const response = await api.get(`${SRI_BASE}monthly-quota/`);
    return response.data;
  },

  /**
   * Upload a file for a submission
   * @param {FormData} formData - FormData containing the file
   * @returns {Promise} - Uploaded file details
   */
  uploadFile: async (formData) => {
    const response = await api.post('/sri/files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a file
   * @param {number} fileId - File ID
   * @returns {Promise}
   */
  deleteFile: async (fileId) => {
    const response = await api.delete(`/sri/files/${fileId}/`);
    return response.data;
  }
};

export default sriService;
