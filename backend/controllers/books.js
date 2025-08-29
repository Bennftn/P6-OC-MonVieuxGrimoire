const Book = require('../models/Book');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/books
 * Récupérer tous les livres
 */
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/books/:id
 * Récupérer un livre par son id
 */
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/books/bestrating
 * Top 3 meilleurs livres
 */
exports.getBestRating = async (req, res) => {
  try {
    const top = await Book.find().sort({ averageRating: -1 }).limit(3);
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/books
 * Créer un nouveau livre (avec image)
 */
exports.createBook = async (req, res) => {
  try {
    if (!req.body.book) {
      return res.status(400).json({ message: 'Champ "book" manquant (form-data).' });
    }

    const bookData = JSON.parse(req.body.book);
    let candidates = [];
    candidates.push(bookData.rating);
    candidates.push(bookData.note);
    candidates.push(bookData.grade);
    if (Array.isArray(bookData.ratings) && bookData.ratings[0]?.grade != null) {
      candidates.push(bookData.ratings[0].grade);
    }
    if (bookData.averageRating != null) candidates.push(bookData.averageRating);

    let initialRating = candidates
      .map(v => Number(v))
      .find(n => Number.isFinite(n));

    if (!Number.isFinite(initialRating)) initialRating = undefined;

    delete bookData.rating;
    delete bookData.note;
    delete bookData.grade;
    delete bookData.ratings;
    delete bookData.averageRating;

    if (!req.savedImageName) {
      return res.status(400).json({ message: 'Image manquante ou format non supporté (jpg, png, webp)' });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.savedImageName}`;

    const book = new Book({
      ...bookData,
      userId: req.auth.userId,
      imageUrl,
      ratings: [],
      averageRating: 0
    });
    // Ajouter la note initiale si valide
    if (Number.isFinite(initialRating) && initialRating >= 0 && initialRating <= 5) {
      book.ratings.push({ userId: req.auth.userId, grade: initialRating });
      book.averageRating = Math.round(initialRating * 10) / 10;
    }

    await book.save();
    res.status(201).json({ message: 'Livre enregistré.' });
  } catch (err) {
    console.error('createBook error:', err);
    res.status(400).json({ message: err.message || 'Données invalides.' });
  }
};


/**
 * PUT /api/books/:id
 * Modifier un livre (avec ou sans nouvelle image)
 */
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });
    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    let newData = req.body;
    if (req.body.book) {
      newData = JSON.parse(req.body.book);
    }

    if (req.savedImageName) {
      // Supprimer l’ancienne image
      const oldImage = book.imageUrl?.split('/images/')[1];
      if (oldImage) {
        const oldPath = path.join(__dirname, '..', 'images', oldImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      newData.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.savedImageName}`;
    }

    Object.assign(book, newData);
    await book.save();
    res.json({ message: 'Livre modifié.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * DELETE /api/books/:id
 * Supprimer un livre (et son image)
 */
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });
    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const image = book.imageUrl?.split('/images/')[1];
    if (image) {
      const imgPath = path.join(__dirname, '..', 'images', image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Book.deleteOne({ _id: book._id });
    res.json({ message: 'Livre supprimé.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/books/:id/rating
 * Noter un livre (une seule note par utilisateur)
 */
exports.rateBook = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'Note invalide (0-5)' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });

    // Vérifier si l’utilisateur a déjà noté
    if (book.ratings.find(r => r.userId === req.auth.userId)) {
      return res.status(400).json({ message: 'Déjà noté' });
    }

    book.ratings.push({ userId: req.auth.userId, grade: rating });
    const avg = book.ratings.reduce((s, r) => s + r.grade, 0) / book.ratings.length;
    book.averageRating = Math.round(avg * 10) / 10;

    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
