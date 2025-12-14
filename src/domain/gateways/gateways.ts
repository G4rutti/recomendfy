import { MusicProfile, PlaylistConcept } from '../entities/MusicProfile';

export interface ISpotifyGateway {
  getTopTracks(userId: string, timeRange?: string, limit?: number): Promise<any[]>;
  getMe(userId: string): Promise<any>;
  getTopArtists(userId: string, timeRange?: string, limit?: number): Promise<any[]>;
  getAudioFeatures(userId: string, trackIds: string[]): Promise<any[]>;
  getRecommendations(userId: string, seedArtists: string[], seedGenres: string[], targetEnergy: number, targetValence: number, limit?: number): Promise<any[]>;
  searchTracks(userId: string, query: string, limit?: number): Promise<any[]>;
  createPlaylist(userId: string, name: string, description: string): Promise<any>;
  addTracksToPlaylist(userId: string, playlistId: string, trackUris: string[]): Promise<void>;
}

export interface ILLMGateway {
  generatePlaylistConcept(profile: MusicProfile): Promise<PlaylistConcept>;
  generateCustomPlaylistConcept(keywords: string, profile: MusicProfile): Promise<PlaylistConcept>;
}
