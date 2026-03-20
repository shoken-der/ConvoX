import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
});
mongoose.connection.on("reconnected", () => {
});
mongoose.connection.on("error", (error) => {
  mongoose.disconnect();
});
mongoose.connection.on("disconnected", () => {
});
