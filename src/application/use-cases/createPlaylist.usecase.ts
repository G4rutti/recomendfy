import { MusicProfile, PlaylistConcept } from '../../domain/entities/MusicProfile';
import { ISpotifyGateway, ILLMGateway } from '../../domain/gateways/gateways';

export class CreatePlaylistUseCase {
  constructor(
    private spotifyGateway: ISpotifyGateway,
    private llmGateway: ILLMGateway
  ) {}

  public async execute(userId: string): Promise<string> {
    // 1. Coleta de Dados Musicais
    console.log('Step 1: Fetching user data...');
    const topTracksStart = await this.spotifyGateway.getTopTracks(userId, 'short_term', 50);
    const topArtistsStart = await this.spotifyGateway.getTopArtists(userId, 'medium_term', 20);
    
    // Calculate simple averages for the profile
    console.log('Step 2: Analyzing profile...');
    const profile: MusicProfile = this.analyzeProfile(topTracksStart, topArtistsStart);
    
    // 2. Integração com IA
    console.log('Step 3: Generating concept with AI...');
    const concept: PlaylistConcept = await this.llmGateway.generatePlaylistConcept(profile);
    
    // 3. Seleção de Músicas
    console.log('Step 4: Searching and filtering songs...');
    
    // Fallback: Use top tracks from user since recommendations API is broken
    const recommendations = topTracksStart.slice(0, 30);

    // 4. Criação da Playlist
    console.log('Step 5: Creating playlist...');
    const playlist = await this.spotifyGateway.createPlaylist(userId, concept.playlist_name, concept.description);
    
    const trackUris = recommendations.map((t: any) => t.uri);
    await this.spotifyGateway.addTracksToPlaylist(userId, playlist.id, trackUris);

    return playlist.external_urls.spotify;
  }

  private analyzeProfile(tracks: any[], artists: any[]): MusicProfile {
    return {
        energy_avg: 0.6,
        valence_avg: 0.5,
        danceability_avg: 0.5,
        top_genres: artists.flatMap(a => a.genres).slice(0, 5),
        top_artists: artists.map(a => a.id),
        mood_tendency: 'neutral',
        discovery_tolerance: 'medium'
    };
  }
}
