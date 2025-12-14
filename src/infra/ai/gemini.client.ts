import { GoogleGenerativeAI } from '@google/generative-ai';
import { MusicProfile, PlaylistConcept } from '../../domain/entities/MusicProfile';
import { ILLMGateway } from '../../domain/gateways/gateways';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiClient implements ILLMGateway {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  public async generatePlaylistConcept(profile: MusicProfile): Promise<PlaylistConcept> {
    try {
      const prompt = this.buildPrompt(profile);
      
      console.log('Sending prompt to Gemini...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response:', text);

      return this.parseResponse(text);
    } catch (error) {
      console.error('Error generating playlist concept with Gemini:', error);
      throw new Error('Failed to generate playlist concept from AI');
    }
  }

  public async generateCustomPlaylistConcept(keywords: string, profile: MusicProfile): Promise<PlaylistConcept> {
    try {
      const prompt = this.buildCustomPrompt(keywords, profile);
      
      console.log('Sending custom prompt to Gemini with keywords:', keywords);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response:', text);

      return this.parseResponse(text);
    } catch (error) {
      console.error('Error generating custom playlist concept with Gemini:', error);
      throw new Error('Failed to generate custom playlist concept from AI');
    }
  }

  private buildPrompt(profile: MusicProfile): string {
    return `
Você é um curador musical especialista.

Com base no perfil musical abaixo, crie o CONCEITO de uma playlist personalizada.

REGRAS:
- NÃO cite músicas específicas
- NÃO cite álbuns
- NÃO cite links
- Responda SOMENTE em JSON puro (sem markdown, sem \`\`\`json)
- Siga exatamente o formato fornecido
- Valores de energy e valence devem estar entre 0.0 e 1.0

Perfil musical:
${JSON.stringify(profile, null, 2)}

Formato obrigatório da resposta:
{
  "playlist_name": "string",
  "description": "string",
  "target_energy": [0.0, 1.0],
  "target_valence": [0.0, 1.0],
  "preferred_genres": ["string"],
  "novelty": 0.0,
  "avoid_artists": ["string"]
}
`;
  }

  private buildCustomPrompt(keywords: string, profile: MusicProfile): string {
    return `
Você é um curador musical especialista.

O usuário quer uma playlist com base nas seguintes palavras-chave: "${keywords}"

Considere também o perfil musical do usuário para personalizar:
${JSON.stringify(profile, null, 2)}

REGRAS:
- Crie um nome e descrição criativos que reflitam as palavras-chave
- NÃO cite músicas específicas
- NÃO cite álbuns
- NÃO cite links
- Responda SOMENTE em JSON puro (sem markdown, sem \`\`\`json)
- Siga exatamente o formato fornecido
- Valores de energy e valence devem estar entre 0.0 e 1.0
- Use as palavras-chave para definir o estilo da playlist

Formato obrigatório da resposta:
{
  "playlist_name": "string",
  "description": "string",
  "target_energy": [0.0, 1.0],
  "target_valence": [0.0, 1.0],
  "preferred_genres": ["string"],
  "novelty": 0.0,
  "avoid_artists": ["string"]
}
`;
  }

  private parseResponse(text: string): PlaylistConcept {
    try {
      // Remove potential markdown code blocks if the model ignores the "JSON puro" instruction
      let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const json = JSON.parse(cleanText);

      // Basic validation
      if (!json.playlist_name || !json.target_energy || !json.target_valence) {
        throw new Error('Missing required fields in JSON response');
      }

      return json as PlaylistConcept;
    } catch (error) {
      console.error('Failed to parse JSON from Gemini response:', text);
      throw new Error('Invalid JSON response from AI');
    }
  }
}
