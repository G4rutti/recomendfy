import { Response } from 'express';
import { SpotifyOAuth } from '../../infra/auth/spotify.oauth';
import { CreatePlaylistUseCase } from '../../application/use-cases/createPlaylist.usecase';
import { CustomPlaylistUseCase } from '../../application/use-cases/customPlaylist.usecase';
import { SpotifyClient } from '../../infra/spotify/spotify.client';
import { GeminiClient } from '../../infra/ai/gemini.client';
import { GetMusicProfileUseCase } from '../../application/use-cases/getMusicProfile.usecase';
import { AuthRequest, generateToken } from '../../infra/auth/auth.middleware';
import { SupabaseService } from '../../infra/database/supabase.service';

export class PlaylistController {
  private oauth: SpotifyOAuth;
  private createPlaylistUseCase: CreatePlaylistUseCase;
  private customPlaylistUseCase: CustomPlaylistUseCase;
  private getMusicProfileUseCase: GetMusicProfileUseCase;
  private supabase: SupabaseService;

  constructor() {
    this.oauth = SpotifyOAuth.getInstance();
    this.supabase = SupabaseService.getInstance();
    
    const spotifyClient = new SpotifyClient();
    const llmClient = new GeminiClient();
    this.createPlaylistUseCase = new CreatePlaylistUseCase(spotifyClient, llmClient);
    this.customPlaylistUseCase = new CustomPlaylistUseCase(spotifyClient, llmClient);
    this.getMusicProfileUseCase = new GetMusicProfileUseCase(spotifyClient);
  }

  public getProfile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const profile = await this.getMusicProfileUseCase.execute(req.user.id);
      res.json({ success: true, profile });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
  };

  public login = (req: AuthRequest, res: Response) => {
    const url = this.oauth.getAuthorizationUrl();
    res.redirect(url);
  };

  public callback = async (req: AuthRequest, res: Response) => {
    const { code } = req.query;
    if (!code) {
      res.status(400).send('Code is required');
      return;
    }

    try {
      // Exchange code for tokens and create/update user
      const { user } = await this.oauth.exchangeCodeForTokens(code as string);
      
      // Generate JWT token
      const token = generateToken({
        id: user.id,
        spotifyId: user.spotify_id,
        email: user.email,
        displayName: user.display_name
      });

      // Redirect to Frontend with token and user data
      const userPayload = encodeURIComponent(JSON.stringify(user));
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userPayload}`);
    } catch (error) {
      console.error(error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?error=auth_failed`);
    }
  };

  public generate = async (req: AuthRequest, res: Response) => {
      try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
          }

          const playlistUrl = await this.createPlaylistUseCase.execute(req.user.id);
          
          // Save playlist to database
          // Extract playlist ID from URL
          const playlistId = playlistUrl.split('/').pop() || '';
          
          await this.supabase.savePlaylist({
            userId: req.user.id,
            spotifyPlaylistId: playlistId,
            name: 'Sua Playlist Recomenfy',
            description: 'Curadoria especial baseada na sua vibe atual.',
            playlistUrl: playlistUrl,
            type: 'auto',
            trackCount: 30
          });

          res.json({ success: true, playlistUrl });
      } catch (error: any) {
          console.error(error);
          res.status(500).json({ success: false, error: error.message });
      }
  }

  public generateCustom = async (req: AuthRequest, res: Response) => {
      try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
          }

          const { keywords, discoveryMode } = req.body;
          
          if (!keywords) {
              res.status(400).json({ success: false, error: 'Keywords are required' });
              return;
          }

          const result = await this.customPlaylistUseCase.execute(req.user.id, {
              keywords,
              discoveryMode: discoveryMode || false
          });
          
          res.json({ success: true, ...result });
      } catch (error: any) {
          console.error(error);
          res.status(500).json({ success: false, error: error.message });
      }
  }

  public createFromTracks = async (req: AuthRequest, res: Response) => {
      try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
          }

          const { name, description, trackUris, keywords } = req.body;
          
          if (!name || !trackUris || !Array.isArray(trackUris)) {
              res.status(400).json({ success: false, error: 'Name and trackUris are required' });
              return;
          }

          const spotifyClient = new SpotifyClient();
          const playlist: any = await spotifyClient.createPlaylist(req.user.id, name, description || '');
          await spotifyClient.addTracksToPlaylist(req.user.id, playlist.id, trackUris);
          
          // Save to database
          await this.supabase.savePlaylist({
            userId: req.user.id,
            spotifyPlaylistId: playlist.id,
            name: name,
            description: description || '',
            playlistUrl: playlist.external_urls.spotify,
            type: 'custom',
            keywords: keywords || '',
            trackCount: trackUris.length
          });

          res.json({ success: true, playlistUrl: playlist.external_urls.spotify });
      } catch (error: any) {
          console.error(error);
          res.status(500).json({ success: false, error: error.message });
      }
  }

  public getHistory = async (req: AuthRequest, res: Response) => {
      try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
          }

          const playlists = await this.supabase.getUserPlaylists(req.user.id);
          res.json({ success: true, playlists });
      } catch (error: any) {
          console.error(error);
          res.status(500).json({ success: false, error: error.message });
      }
  }

  public me = async (req: AuthRequest, res: Response) => {
      try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
          }

          const user = await this.supabase.getUserById(req.user.id);
          res.json({ success: true, user });
      } catch (error: any) {
          console.error(error);
          res.status(500).json({ success: false, error: error.message });
      }
  }

  public getUserPlaylists = async (req: AuthRequest, res: Response) => {
      try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
          }

          const spotifyClient = new SpotifyClient();
          const playlists = await spotifyClient.getUserPlaylists(req.user.id);
          res.json({ success: true, playlists });
      } catch (error: any) {
          console.error(error);
          res.status(500).json({ success: false, error: error.message });
      }
  }
}
