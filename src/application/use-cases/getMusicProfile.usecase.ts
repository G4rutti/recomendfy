import { MusicProfile } from '../../domain/entities/MusicProfile';
import { ISpotifyGateway } from '../../domain/gateways/gateways';

export class GetMusicProfileUseCase {
  constructor(private spotifyGateway: ISpotifyGateway) {}

  public async execute(userId: string): Promise<any> {
    const topArtists = await this.spotifyGateway.getTopArtists(userId, 'medium_term', 20);
    const topGenres = this.extractTopGenres(topArtists);

    // Heuristics based on Genres
    const { energy, valence, danceability } = this.estimateFeatures(topGenres);

    // Determine Mood Tendency
    let mood = 'Neutral';
    if (energy > 0.7 && valence > 0.6) mood = 'Empolgado/Extrovertido';
    else if (energy > 0.7 && valence < 0.4) mood = 'Intenso/Agressivo';
    else if (energy < 0.4 && valence > 0.6) mood = 'Relaxado/Pacífico';
    else if (energy < 0.4 && valence < 0.4) mood = 'Melancólico/Triste';
    else if (energy > 0.5) mood = 'Energético';
    else mood = 'Chill';

    // Full artist data for modal
    const top_artists_full = topArtists.slice(0, 20).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      images: artist.images,
      genres: artist.genres,
      followers: artist.followers,
      popularity: artist.popularity,
      external_urls: artist.external_urls
    }));

    return {
      energy_avg: energy,
      valence_avg: valence,
      danceability_avg: danceability,
      top_genres: topGenres,
      top_artists: topArtists.slice(0, 5).map((a: any) => a.name),
      top_artists_full,
      mood_tendency: mood,
      discovery_tolerance: 'medium'
    };
  }

  private extractTopGenres(artists: any[]): string[] {
    const genreCounts: { [key: string]: number } = {};
    artists.forEach((artist: any) => {
      artist.genres.forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);
  }

  private estimateFeatures(genres: string[]): { energy: number, valence: number, danceability: number } {
    let energySum = 0;
    let valenceSum = 0;
    let danceSum = 0;
    let count = 0;

    const GENRE_MAP: { [key: string]: any } = {
        'pop': { e: 0.8, v: 0.8, d: 0.8 },
        'rock': { e: 0.8, v: 0.5, d: 0.5 },
        'hip hop': { e: 0.7, v: 0.6, d: 0.8 },
        'rap': { e: 0.7, v: 0.5, d: 0.8 },
        'indie': { e: 0.6, v: 0.6, d: 0.6 },
        'jazz': { e: 0.4, v: 0.6, d: 0.5 },
        'classical': { e: 0.2, v: 0.5, d: 0.1 },
        'metal': { e: 0.95, v: 0.3, d: 0.3 },
        'dance': { e: 0.9, v: 0.8, d: 0.9 },
        'electronic': { e: 0.8, v: 0.7, d: 0.8 },
        'latin': { e: 0.8, v: 0.9, d: 0.9 },
        'folk': { e: 0.3, v: 0.5, d: 0.4 },
        'r&b': { e: 0.5, v: 0.6, d: 0.7 },
    };

    genres.forEach(genre => {
        const lower = genre.toLowerCase();
        let match = false;
        for (const [key, val] of Object.entries(GENRE_MAP)) {
            if (lower.includes(key)) {
                energySum += val.e;
                valenceSum += val.v;
                danceSum += val.d;
                count++;
                match = true;
                break;
            }
        }
        if (!match) {
            energySum += 0.5;
            valenceSum += 0.5;
            danceSum += 0.5;
            count++;
        }
    });

    if (count === 0) return { energy: 0.5, valence: 0.5, danceability: 0.5 };

    return {
        energy: parseFloat((energySum / count).toFixed(2)),
        valence: parseFloat((valenceSum / count).toFixed(2)),
        danceability: parseFloat((danceSum / count).toFixed(2))
    };
  }
}
