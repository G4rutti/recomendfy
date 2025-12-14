import axios from 'axios';
import dotenv from 'dotenv';
import { SupabaseService } from '../database/supabase.service';

dotenv.config();

export class SpotifyOAuth {
  private static instance: SpotifyOAuth;
  private supabase: SupabaseService;
  
  private clientId = (process.env.SPOTIFY_CLIENT_ID || '').trim();
  private clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();
  private redirectUri = (process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/callback').trim();

  private constructor() {
    this.supabase = SupabaseService.getInstance();
  }

  public static getInstance(): SpotifyOAuth {
    if (!SpotifyOAuth.instance) {
      SpotifyOAuth.instance = new SpotifyOAuth();
    }
    return SpotifyOAuth.instance;
  }

  public getAuthorizationUrl(): string {
    const scopes = [
      'user-top-read',
      'user-library-read',
      'user-read-recently-played',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-email'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public async exchangeCodeForTokens(code: string): Promise<{ user: any; tokens: any }> {
    try {
      // Exchange code for tokens
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      });

      const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
        },
      });

      const tokenData = response.data as any;

      // Get Spotify user profile
      const userResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      const spotifyUser = userResponse.data;

      // Create or update user in Supabase
      const user = await this.supabase.createOrUpdateUser(spotifyUser);

      // Save tokens in Supabase
      await this.supabase.saveSpotifyTokens(
        user.id,
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expires_in
      );

      console.log(`✅ User authenticated: ${user.display_name} (${user.spotify_id})`);

      return { user, tokens: tokenData };

    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  public async getAccessToken(userId: string): Promise<string> {
    const tokens = await this.supabase.getSpotifyTokens(userId);
    
    if (!tokens) {
      throw new Error('User not authenticated');
    }

    // Check if token is expired
    const expiresAt = new Date(tokens.expires_at).getTime();
    const now = Date.now();

    if (now >= expiresAt) {
      // Token expired, refresh it
      await this.refreshTokens(userId);
      const newTokens = await this.supabase.getSpotifyTokens(userId);
      return newTokens!.access_token;
    }

    return tokens.access_token;
  }

  private async refreshTokens(userId: string): Promise<void> {
    const tokens = await this.supabase.getSpotifyTokens(userId);
    
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      });

      const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
        },
      });

      const data = response.data as any;

      // Update tokens in Supabase
      await this.supabase.saveSpotifyTokens(
        userId,
        data.access_token,
        data.refresh_token || tokens.refresh_token,
        data.expires_in
      );

      console.log(`✅ Tokens refreshed for user: ${userId}`);

    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw new Error('Failed to refresh token');
    }
  }
}
