const express = require('express');
const router = express.Router();

const { downloadGameExcel } = require('../controllers/userGameController');
const { getExpiredGames } = require('../controllers/userController');

const authController = require('../controllers/authController');
const { registerUser, loginUser } = authController;

const authMiddleware = require('../middleware/authMiddleware');
const { protect } = authMiddleware;

const userController = require('../controllers/userController');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  submitPrediction,
  getMyPredictions,
  deposit,
  getMyTransactions,
  withdrawFunds,
  claimPrize,
  getSingleCryptoDeposit
} = userController;

router.post('/register', registerUser);
router.post('/login', loginUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.put('/change-password', protect, changePassword);
router.post('/deposit', protect, deposit);
router.post('/withdraw', protect, withdrawFunds);
router.get('/my-predictions', protect, getMyPredictions);
router.get('/my-transactions', protect, getMyTransactions);
router.post('/predict', protect, submitPrediction);
router.post('/claim-prize/:gameId', protect, claimPrize);
router.get('/crypto-deposits/:id', protect, getSingleCryptoDeposit);
router.get('/games/expired', protect, getExpiredGames);
router.get('/games/:gameId/download', protect, downloadGameExcel);

module.exports = router;
