import axios from 'axios';
import { SpotifyOAuth } from '../auth/spotify.oauth';
import { ISpotifyGateway } from '../../domain/gateways/gateways';

export class SpotifyClient implements ISpotifyGateway {
  private oauth: SpotifyOAuth;

  constructor() {
    this.oauth = SpotifyOAuth.getInstance();
  }

  private async getClient(userId: string) {
    const token = await this.oauth.getAccessToken(userId);
    return axios.create({
      baseURL: 'https://api.spotify.com/v1',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  public async getMe(userId: string) {
    const client = await this.getClient(userId);
    const response = await client.get('/me');
    return response.data;
  }

  public async getTopTracks(userId: string, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 50) {
    const client = await this.getClient(userId);
    const response = await client.get(`/me/top/tracks`, {
      params: { time_range: timeRange, limit },
    });
    return (response.data as any).items;
  }

  public async getTopArtists(userId: string, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 50) {
    const client = await this.getClient(userId);
    const response = await client.get(`/me/top/artists`, {
      params: { time_range: timeRange, limit },
    });
    return (response.data as any).items;
  }

  public async getAudioFeatures(userId: string, trackIds: string[]) {
    const client = await this.getClient(userId);
    // Spotify allows up to 100 ids per request
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }

    let allFeatures: any[] = [];
    for (const chunk of chunks) {
        const response = await client.get(`/audio-features`, {
            params: { ids: chunk.join(',') },
        });
        allFeatures = [...allFeatures, ...(response.data as any).audio_features];
    }
    
    return allFeatures;
  }


  public async getAvailableGenreSeeds(userId: string): Promise<string[]> {
    // Import genres dynamically to avoid circular dependencies
    const { SPOTIFY_GENRES } = await import('./spotify-genres');
    return SPOTIFY_GENRES;
  }

  public async getRecommendations(
    userId: string, 
    seedArtists: string[], 
    seedGenres: string[], 
    targetEnergy: number, 
    targetValence: number,
    limit = 30
  ) {
    const client = await this.getClient(userId);
    
    // Get available genres from Spotify
    const availableGenres = await this.getAvailableGenreSeeds(userId);
    console.log(`Total available genres: ${availableGenres.length}`);
    
    // Normalize genres: replace spaces with hyphens and lowercase
    const normalizedGenres = seedGenres
      .map(genre => genre.toLowerCase().replace(/\s+/g, '-'));
    
    // Filter only valid genres that Spotify recognizes
    const validGenres = normalizedGenres
      .filter(genre => availableGenres.includes(genre))
      .slice(0, 3);
    
    const invalidGenres = normalizedGenres.filter(genre => !availableGenres.includes(genre));
    
    console.log('Seed genres from AI:', seedGenres);
    console.log('Normalized genres:', normalizedGenres);
    console.log('Valid genres found:', validGenres);
    console.log('Invalid genres (will be skipped):', invalidGenres);
    
    // If no valid genres, use only artist seeds
    const seeds: any = {
      seed_artists: seedArtists.slice(0, validGenres.length > 0 ? 2 : 5).join(','),
    };
    
    if (validGenres.length > 0) {
      seeds.seed_genres = validGenres.join(',');
    }

    console.log('Requesting recommendations with seeds:', seeds);

    const response = await client.get(`/recommendations`, {
      params: {
        ...seeds,
        target_energy: targetEnergy,
        target_valence: targetValence,
        limit
      },
    });
    return (response.data as any).tracks;
  }

  public async searchTracks(userId: string, query: string, limit = 10) {
      const client = await this.getClient(userId);
      const response = await client.get('/search', {
          params: {
              q: query,
              type: 'track',
              limit
          }
      });
      return (response.data as any).tracks.items;
  }

  public async createPlaylist(userId: string, name: string, description: string) {
    const client = await this.getClient(userId);
    // User ID is needed for the endpoint, usually we can get it from /me, but here we assume we have the Spotify User ID (not our internal one, if different). 
    // Assuming passed userId is the internal one, we need to fetch the Spotify ID first.
    const me = await client.get('/me');
    const spotifyUserId = (me.data as any).id;

    const response = await client.post(`/users/${spotifyUserId}/playlists`, {
      name,
      description,
      public: true,
    });
    return response.data;
  }

  public async addTracksToPlaylist(userId: string, playlistId: string, trackUris: string[]) {
    const client = await this.getClient(userId);
    await client.post(`/playlists/${playlistId}/tracks`, {
      uris: trackUris,
    });
  }

  public async getUserPlaylists(userId: string, limit = 50): Promise<any[]> {
    const client = await this.getClient(userId);
    const response = await client.get('/me/playlists', {
      params: { limit }
    });
    return (response.data as any).items;
  }
}
