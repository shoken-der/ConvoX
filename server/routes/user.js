import express from "express";

import { getAllUsers, getUser, searchUsers } from "../controllers/user.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:userId", getUser);
router.post("/users", searchUsers);

export default router;
