// authroutes
import express from 'express';
import { 
  loginUser, 
  adminLogin, 
  signupUser, 
  requestPasswordReset, 
  resetPassword, 
  getMe, 
  updateProfile, 
  updateUserFirstOrder,
  createTemporaryUser,
  completeProfile 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkTemporaryUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.post('/signup', signupUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});
router.patch('/users/:id', authenticateToken, updateUserFirstOrder);

// New routes for temporary user functionality
router.post('/temporary-user', createTemporaryUser);
router.post('/complete-profile', authenticateToken, completeProfile);

export default router;