import { MusicProfile, PlaylistConcept } from '../../domain/entities/MusicProfile';
import { ISpotifyGateway, ILLMGateway } from '../../domain/gateways/gateways';

export interface CustomPlaylistRequest {
  keywords: string;
  discoveryMode: boolean;
}

export interface TrackInfo {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  uri: string;
}

export class CustomPlaylistUseCase {
  constructor(
    private spotifyGateway: ISpotifyGateway,
    private llmGateway: ILLMGateway
  ) {}

  public async execute(userId: string, request: CustomPlaylistRequest): Promise<{
    tracks: TrackInfo[];
    playlistConcept: { name: string; description: string };
  }> {
    console.log('Step 1: Fetching user profile for context...');
    const topTracks = await this.spotifyGateway.getTopTracks(userId, 'medium_term', 50);
    const topArtists = await this.spotifyGateway.getTopArtists(userId, 'medium_term', 20);

    // Build user profile for AI context
    const profile: MusicProfile = {
      energy_avg: 0.6,
      valence_avg: 0.5,
      danceability_avg: 0.5,
      top_genres: topArtists.flatMap((a: any) => a.genres).slice(0, 5),
      top_artists: topArtists.map((a: any) => a.id),
      mood_tendency: 'neutral',
      discovery_tolerance: 'medium'
    };

    console.log('Step 2: Generating playlist concept with AI based on keywords...');
    const concept = await this.llmGateway.generateCustomPlaylistConcept(
      request.keywords,
      profile
    );

    console.log('Step 3: Searching for tracks based on keywords...');
    const searchQuery = request.keywords;
    const searchResults = await this.spotifyGateway.searchTracks(userId, searchQuery, 50);

    let tracks = searchResults;

    // Filter out already heard tracks if discovery mode is enabled
    if (request.discoveryMode) {
      console.log('Step 4: Filtering out already heard tracks (discovery mode)...');
      const topTrackIds = new Set(topTracks.map((t: any) => t.id));
      tracks = tracks.filter((t: any) => !topTrackIds.has(t.id));
    }

    // Limit to 30 tracks
    tracks = tracks.slice(0, 30);

    console.log(`Step 5: Returning ${tracks.length} tracks for approval`);

    // Format tracks for frontend
    const formattedTracks: TrackInfo[] = tracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      albumArt: track.album?.images[0]?.url || '',
      uri: track.uri
    }));

    return {
      tracks: formattedTracks,
      playlistConcept: {
        name: concept.playlist_name,
        description: concept.description
      }
    };
  }
}
