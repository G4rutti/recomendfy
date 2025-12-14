import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient;

  private constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in environment variables');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase connected successfully');
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public getClient(): SupabaseClient {
    return this.client;
  }

  // User operations
  public async createOrUpdateUser(spotifyUser: any) {
    const { data, error } = await this.client
      .from('users')
      .upsert({
        spotify_id: spotifyUser.id,
        email: spotifyUser.email,
        display_name: spotifyUser.display_name,
        profile_image: spotifyUser.images?.[0]?.url || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'spotify_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public async getUserBySpotifyId(spotifyId: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('spotify_id', spotifyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  public async getUserById(userId: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Token operations
  public async saveSpotifyTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { data, error } = await this.client
      .from('spotify_tokens')
      .upsert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public async getSpotifyTokens(userId: string) {
    const { data, error } = await this.client
      .from('spotify_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Playlist operations
  public async savePlaylist(playlistData: {
    userId: string;
    spotifyPlaylistId: string;
    name: string;
    description: string;
    playlistUrl: string;
    type: 'auto' | 'custom';
    keywords?: string;
    trackCount: number;
  }) {
    const { data, error } = await this.client
      .from('playlists')
      .insert({
        user_id: playlistData.userId,
        spotify_playlist_id: playlistData.spotifyPlaylistId,
        name: playlistData.name,
        description: playlistData.description,
        playlist_url: playlistData.playlistUrl,
        type: playlistData.type,
        keywords: playlistData.keywords || null,
        track_count: playlistData.trackCount
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public async getUserPlaylists(userId: string) {
    const { data, error } = await this.client
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  public async deletePlaylist(userId: string, playlistId: string) {
    const { error } = await this.client
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
