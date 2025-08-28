const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_EXPIRES_IN = '24h';

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // options de sécurité de base
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis.' });
    if (password.length < 8) return res.status(400).json({ message: 'Mot de passe trop court (min 8).' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash });
    return res.status(201).json({ message: 'Utilisateur créé.' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email déjà utilisé.' });
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Identifiants invalides.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Identifiants invalides.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(200).json({ userId: user._id, token });
  } catch {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
