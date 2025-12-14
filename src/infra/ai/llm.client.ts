import { MusicProfile, PlaylistConcept } from '../../domain/entities/MusicProfile';
import { ILLMGateway } from '../../domain/gateways/gateways';

export class OpenAIClient implements ILLMGateway {
  // Mock implementation for MVP to avoid needing valid API Key immediately
  // In a real scenario, this would call OpenAI API
  
  async generatePlaylistConcept(profile: MusicProfile): Promise<PlaylistConcept> {
    console.log('Generating playlist concept for profile:', JSON.stringify(profile, null, 2));

    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Logic to pick a concept based on profile (Mock AI)
    const isEnergetic = profile.energy_avg > 0.6;
    const isSad = profile.valence_avg < 0.4;
    
    let concept: PlaylistConcept = {
      playlist_name: "Daily Mix",
      description: "A mix for your day.",
      target_energy: [0.4, 0.7],
      target_valence: [0.4, 0.7],
      preferred_genres: ["pop"],
      novelty: 0.3,
      avoid_artists: []
    };

    if (isEnergetic) {
       concept = {
        playlist_name: "High Voltage Vibes",
        description: "Keep the energy flowing with these upbeat tracks.",
        target_energy: [0.7, 0.95],
        target_valence: [0.5, 0.9],
        preferred_genres: ["dance pop", "house", "rock"],
        novelty: 0.2,
        avoid_artists: []
      };
    } else if (isSad) {
       concept = {
        playlist_name: "Melancholy Moments",
        description: "Introspective tunes for valid feelings.",
        target_energy: [0.2, 0.5],
        target_valence: [0.1, 0.4],
        preferred_genres: ["indie folk", "sad lo-fi"],
        novelty: 0.5,
        avoid_artists: []
      };
    } else {
        concept = {
            playlist_name: "Chill Discovery",
            description: "Relax and find something new.",
            target_energy: [0.3, 0.6],
            target_valence: [0.4, 0.7],
            preferred_genres: ["lo-fi", "indie pop"],
            novelty: 0.7,
            avoid_artists: []
        }
    }

    return concept;
  }
}
