
import { Router, Request, Response } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";

const router = Router();
router.post("/login", loginUser);

router.post("/register", registerUser);

export default router;
