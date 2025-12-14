export interface MusicProfile {
  energy_avg: number;
  valence_avg: number;
  danceability_avg: number;
  top_genres: string[];
  top_artists: string[];
  mood_tendency: string;
  discovery_tolerance: 'low' | 'medium' | 'high';
}

export interface PlaylistConcept {
  playlist_name: string;
  description: string;
  target_energy: [number, number];
  target_valence: [number, number];
  preferred_genres: string[];
  novelty: number; // 0.0 to 1.0
  avoid_artists: string[];
}
