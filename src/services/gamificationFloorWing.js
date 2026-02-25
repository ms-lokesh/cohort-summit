/**
 * Gamification API Service for Floor Wings
 */
import api from './api';

const gamificationFloorWingAPI = {
  // Seasons
  getSeasons: () => api.get('/gamification/floorwing/seasons/'),
  createSeason: (seasonData) => api.post('/gamification/floorwing/seasons/', seasonData),
  updateSeason: (seasonId, seasonData) => api.put(`/gamification/floorwing/seasons/${seasonId}/`, seasonData),
  deleteSeason: (seasonId) => api.delete(`/gamification/floorwing/seasons/${seasonId}/`),
  
  // Episodes
  getEpisodes: (seasonId) => api.get(`/gamification/floorwing/seasons/${seasonId}/episodes/`),
  createEpisode: (seasonId, episodeData) => api.post(`/gamification/floorwing/seasons/${seasonId}/episodes/`, episodeData),
  updateEpisode: (episodeId, episodeData) => api.put(`/gamification/floorwing/episodes/${episodeId}/`, episodeData),
  deleteEpisode: (episodeId) => api.delete(`/gamification/floorwing/episodes/${episodeId}/`),
};

export default gamificationFloorWingAPI;
