import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("[Mongo] MONGO_URI is missing. Chat room APIs will not work.");
} else {
  mongoose
    .connect(MONGO_URI, {
      // Fail fast so requests don't hang until Render returns 502
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
    })
    .catch((err) => {
      console.error("[Mongo] Initial connection failed:", err.message);
    });
}

mongoose.connection.on("connected", () => {
  console.log("[Mongo] Connected");
});
mongoose.connection.on("reconnected", () => {
  console.log("[Mongo] Reconnected");
});
mongoose.connection.on("error", (error) => {
  // Keep the process alive and allow Mongoose to recover.
  // Disconnecting here can make all chat routes fail repeatedly.
  console.error("[Mongo] Connection error:", error.message);
});
mongoose.connection.on("disconnected", () => {
  console.warn("[Mongo] Disconnected");
});
