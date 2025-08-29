const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/multer-config');
const ctrl = require('../controllers/books');

router.get('/', ctrl.getBooks);
router.get('/bestrating', ctrl.getBestRating);
router.get('/:id', ctrl.getBook);
router.post('/', auth, upload, ctrl.createBook);
router.put('/:id', auth, upload, ctrl.updateBook);
router.delete('/:id', auth, ctrl.deleteBook);
router.post('/:id/rating', auth, ctrl.rateBook);

module.exports = router;
