
import { Router, Request, Response } from "express";
import { findUserByEmail, comparePassword, generateToken } from "../auth/services";
import expressAsyncHandler from "express-async-handler";
import { registerUser, loginUser } from "../controllers/auth.controller";

const router = Router();
router.post("/login", loginUser);

router.post("/register", registerUser);

export default router;
