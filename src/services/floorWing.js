import api from './api';

const floorWingService = {
  /**
   * Get Floor Wing dashboard stats
   */
  getDashboard: async () => {
    const response = await api.get('/profiles/floor-wing/dashboard/');
    return response.data;
  },

  /**
   * Get all students in the floor
   */
  getStudents: async (params = {}) => {
    const response = await api.get('/profiles/floor-wing/students/', { params });
    return response.data;
  },

  /**
   * Get all mentors in the floor
   */
  getMentors: async () => {
    const response = await api.get('/profiles/floor-wing/mentors/');
    return response.data;
  },

  /**
   * Assign student to mentor
   */
  assignStudent: async (studentId, mentorId) => {
    const response = await api.post('/profiles/floor-wing/assign-student/', {
      student_id: studentId,
      mentor_id: mentorId
    });
    return response.data;
  },

  /**
   * Add a new student to the floor
   */
  addStudent: async (studentData) => {
    const response = await api.post('/profiles/floor-wing/add-student/', studentData);
    return response.data;
  },

  /**
   * Add a new mentor to the floor
   */
  addMentor: async (mentorData) => {
    const response = await api.post('/profiles/floor-wing/add-mentor/', mentorData);
    return response.data;
  },
};

export default floorWingService;
