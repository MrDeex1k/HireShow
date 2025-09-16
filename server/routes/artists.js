const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/createnew', artistController.registerArtistFull);
router.post('/photos/registration', upload.array('photos', 5), artistController.uploadArtistPhotosRegistration);
router.post('/photos', verifyToken, requireRole(['artist']), upload.array('photos', 5), artistController.uploadArtistPhotos);

router.put('/update', verifyToken, requireRole(['artist','admin']), artistController.updateArtist);
router.put('/premium-status', verifyToken, requireRole(['admin']), artistController.updatePremiumStatus);
router.put('/experience-level', verifyToken, requireRole(['admin']), artistController.updateExperienceLevel);

router.delete('/photos/:photo_id', verifyToken, requireRole(['artist']), artistController.deleteArtistPhoto);

router.put('/photos/order', verifyToken, requireRole(['artist']), artistController.updateArtistPhotosOrder);

router.get('/by-user/:user_id', verifyToken, requireRole(['artist','admin']), artistController.getArtistByUserId);
router.get('/details/:artist_id', verifyToken, requireRole(['client','admin']), artistController.getArtistByIdWithPhotos);
router.get('/', artistController.getAllArtists);
router.get('/search', verifyToken, requireRole(['client','admin']), artistController.searchArtists);

module.exports = router;
