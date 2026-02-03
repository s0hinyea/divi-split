import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// JWKS client to fetch public keys from Supabase
const client = jwksClient({
    jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5
});

// Function to get the signing key
const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            console.error('[Auth] Error fetching signing key:', err.message);
            callback(err, null);
        } else {
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
        }
    });
};

export const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header'
        });
    }

    const token = authHeader.split(' ')[1];

    // Verify using ES256 with public key from JWKS
    jwt.verify(token, getKey, { algorithms: ['ES256'] }, (err, decoded) => {
        if (err) {
            console.error('[Auth] JWT Verification Failed:', err.message);
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }

        req.user = decoded;
        next();
    });
};