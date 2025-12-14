import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PlaylistController } from './presentation/controllers/playlist.controller';
import { authMiddleware } from './infra/auth/auth.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const playlistController = new PlaylistController();

// Public routes (no auth required)
app.get('/auth/login', playlistController.login);
app.get('/auth/callback', playlistController.callback);

// Protected routes (auth required)
app.get('/auth/me', authMiddleware, playlistController.me);
app.get('/user/profile', authMiddleware, playlistController.getProfile);
app.get('/user/playlists', authMiddleware, playlistController.getUserPlaylists);
app.post('/playlist/generate', authMiddleware, playlistController.generate);
app.post('/playlist/custom', authMiddleware, playlistController.generateCustom);
app.post('/playlist/create-from-tracks', authMiddleware, playlistController.createFromTracks);
app.get('/playlist/history', authMiddleware, playlistController.getHistory);

if (!process.env.SPOTIFY_CLIENT_ID) {
    console.warn("WARNING: SPOTIFY_CLIENT_ID is not set in .env");
}

// Only start server if not in Vercel (serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`1. Login first: http://localhost:${port}/auth/login`);
    console.log(`2. Then POST to: http://localhost:${port}/playlist/generate`);
  });
}

// Export for Vercel serverless
export default app;
