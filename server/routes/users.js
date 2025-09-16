const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/createnew', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/update-password', userController.updatePassword);
router.get('/pending', verifyToken, requireRole(['admin']), userController.getPendingUsers);
router.get('/rejected', verifyToken, requireRole(['admin']), userController.getRejectedUsers);
router.param('user_id', (req, res, next, value) => {
  if (!/^\d+$/.test(value)) {
    return res.status(404).end();
  }
  next();
});
router.get('/:user_id/details', verifyToken, requireRole(['admin']), userController.getUserDetails);
router.put('/:user_id/approval', verifyToken, requireRole(['admin']), userController.updateUserApprovalStatus);
router.get('/:user_id', userController.getUserById);

module.exports = router;