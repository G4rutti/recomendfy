-- =====================================================
-- RECOMENFY - Schema do Banco de Dados Supabase
-- =====================================================

-- Tabela de Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spotify_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para users
CREATE INDEX idx_users_spotify_id ON users(spotify_id);

-- Tabela de Tokens do Spotify
CREATE TABLE spotify_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices para spotify_tokens
CREATE INDEX idx_spotify_tokens_user_id ON spotify_tokens(user_id);
CREATE INDEX idx_spotify_tokens_expires_at ON spotify_tokens(expires_at);

-- Tabela de Playlists
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  spotify_playlist_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  playlist_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('auto', 'custom')),
  keywords TEXT,
  track_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para playlists
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_created_at ON playlists(created_at DESC);
CREATE INDEX idx_playlists_type ON playlists(type);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spotify_tokens_updated_at
    BEFORE UPDATE ON spotify_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (true);

-- Políticas RLS para spotify_tokens
CREATE POLICY "Users can view their own tokens"
    ON spotify_tokens FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own tokens"
    ON spotify_tokens FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own tokens"
    ON spotify_tokens FOR UPDATE
    USING (true);

-- Políticas RLS para playlists
CREATE POLICY "Users can view their own playlists"
    ON playlists FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own playlists"
    ON playlists FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can delete their own playlists"
    ON playlists FOR DELETE
    USING (true);
