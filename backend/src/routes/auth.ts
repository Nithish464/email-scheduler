import { Router } from 'express';
import passport from '../config/passport';
import { getMe, logout } from '../controllers/authController';
import { requireAuth } from '../middlewares/auth';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    session: true,
  }),
  (_req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
  }
);

// Get current user
router.get('/me', requireAuth, getMe);

// Logout
router.post('/logout', logout);

export default router;