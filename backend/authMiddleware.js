import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export const verifyAuth = (req, res, next) => {
    
    const authHeader = req.headers.authorization; 
    
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header'
        }); 
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);

        req.user = decodedToken;

        next();
    } catch (error) { 
        console.error('JWT Verification Failed:', error.message);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
        });
    }
};