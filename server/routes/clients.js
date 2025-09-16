const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/createnew', clientController.registerClientFull);
router.put('/update', verifyToken, requireRole(['client','admin']), clientController.updateClient);
router.get('/by-user/:user_id', verifyToken, requireRole(['admin','client']), clientController.getClientByUserId);
router.get('/', clientController.getAllClients);
router.post('/favorites', verifyToken, requireRole(['client']), clientController.addFavoriteArtist);
router.delete('/favorites/:artist_id', verifyToken, requireRole(['client']), clientController.removeFavoriteArtist);
router.get('/favorites', verifyToken, requireRole(['client']), clientController.listFavoriteArtists);

module.exports = router;