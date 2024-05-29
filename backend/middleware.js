import { JWT_SECRET } from "./config.js";
import * as jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
   const authHeader = req.headers.authorization;

   if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized" });
      return;
   }

   const token = authHeader.split(" ")[1];

   try {
      const decoded = jwt.verify(token, JWT_SECRET);

      req.userId = decoded.userId;
      next();
   } catch {
      res.status(401).json({ message: "Unauthorized" });
   }
};

export { authMiddleware };
