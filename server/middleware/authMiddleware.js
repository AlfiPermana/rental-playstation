const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Token biasanya berbentuk 'Bearer <token>', jadi kita ambil bagian tokennya saja
    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(403).json({ message: 'Invalid token format' });
    }

    try {
        const decoded = jwt.verify(tokenParts[1], process.env.JWT_SECRET);
        req.user = decoded; // Menyimpan payload user di objek request
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

const checkRole = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
    };
};

module.exports = { verifyToken, checkRole };