// middlewares/authMiddlewareOptional.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

export const authMiddlewareOptional = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return next(); // просто идём дальше, пользователь неавторизован

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
    } catch (err) {
        // токен невалидный — игнорируем, но не выбрасываем ошибку
        req.user = null;
    }

    next();
};
