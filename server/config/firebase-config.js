import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;
const serviceAccountPath = path.join(__dirname, "./serviceAccountKey.json");

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  console.warn("Firebase service account credentials not found. Auth will fail.");
}

const app = initializeApp({
  credential: serviceAccount ? cert(serviceAccount) : undefined,
});

const auth = getAuth(app);
export default auth;
