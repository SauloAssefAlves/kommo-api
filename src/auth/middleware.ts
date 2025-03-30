import jwt from "jsonwebtoken";
import {jwtSecret} from "./config";

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Acesso negado" });

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ message: "Token inválido" });
    req.user = user;
    next();
  });
}

export {authenticateToken};
