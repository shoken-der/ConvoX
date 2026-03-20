import auth from "../config/firebase-config.js";

export const VerifyToken = async (req, res, next) => {
  // Skip token verification for OPTIONS requests (CORS preflight)
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decodeValue = await auth.verifyIdToken(token);
    
    if (decodeValue) {
      req.user = decodeValue;
      return next();
    }
    return res.status(401).json({ message: "Invalid token" });
  } catch (e) {
    return res.status(500).json({ message: "Internal Auth Error" });
  }
};

export const VerifySocketToken = async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decodeValue = await auth.verifyIdToken(token);

    if (decodeValue) {
      socket.user = decodeValue;
      return next();
    }
    return next(new Error("Authentication error"));
  } catch (e) {
    return next(new Error("Internal Error"));
  }
};
