const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

function authenticateToken(req, res, next) {
    console.log('Incoming headers:', req.headers); // Log all headers

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    console.log('Received token:', token);

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Authorization token required' 
        });
    }
    console.log('Extracted token:', token);

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid or expired token' 
            });
        }

        if (!decoded.role) {
            return res.status(403).json({
                success: false,
                message: 'Role information missing in token'
            });
        }

        // Garder tes logs
        console.log('Payload du token décodé :', decoded);

        // Mettre ID et rôle dans req
        if (decoded.role === 'admin') {
            req.adminId = decoded.id; 
            req.role = decoded.role;
        } else {
            req.user = {
                userId: decoded.userId || decoded._id,
                role: decoded.role
            };
            req.role = decoded.role; // ajout pour uniformité
        }

        // ✅ Supprimer la vérification globale des routes admin ici
        // Laisse les routes elles-mêmes vérifier si req.role === 'admin'

        next();
    });
}

module.exports = authenticateToken;