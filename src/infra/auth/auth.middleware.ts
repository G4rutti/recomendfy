import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    spotifyId: string;
    email: string;
    displayName: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.id,
      spotifyId: decoded.spotifyId,
      email: decoded.email,
      displayName: decoded.displayName
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Token expired' });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const generateToken = (user: { id: string; spotifyId: string; email: string; displayName: string }): string => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    {
      id: user.id,
      spotifyId: user.spotifyId,
      email: user.email,
      displayName: user.displayName
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
};
