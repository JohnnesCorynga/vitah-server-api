require('dotenv').config();
const jwt = require('jsonwebtoken');

const salt = process.env.SALT_JWT_KEY;

// Generates a JWT token
exports.generateToken = async function (data) {
    try {
        return jwt.sign(data, salt, { expiresIn: '24h' });
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Error generating token'); // Throws error for handling
    }
};

// Decodes a JWT token
exports.decodeToken = (token) => {
    try {
        return jwt.verify(token, salt); // Verifies and decodes the token
    } catch (error) {
        console.error('Error decoding token:', error);
        throw new Error('Invalid token'); // Throws error for handling
    }
};

// Middleware to authorize JWT token
exports.authorizeToken = (req, res, next) => {
    
    try {
        const token = req.headers.token || req.headers.authorization?.replace("Bearer ", "");
        console.log("token", token)
        if (!token) {
            return res.status(401).json({ message: 'Invalid or missing token' });
        }
        jwt.verify(token, salt, (err, decoded) => {
            if (err) {
                console.log('TokenExpiredError: jwt expired: ',err)
                return res.status(401).json({ message: '[Error] Token manipulated - Unauthorized' });
            }
            console.log("DECODED: ",decoded);
            req.user = decoded;
            next();
        });

    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(401).json({ message: 'Authorization error' });
    }

};
