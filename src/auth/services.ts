import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import { jwtSecret, jwtExpiresIn } from "./config";
import { db } from "../config/database.js";

export async function hashPassword(password: string): Promise<string> {
  console.log(CryptoJS.SHA256(password).toString());
  return CryptoJS.SHA256(password).toString();
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  console.log(CryptoJS.SHA256(password).toString(), hash);
  return CryptoJS.SHA256(password).toString() === hash;
}

export function generateToken(user: { id: string; email: string }): string {
  return jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
}

export async function findUserByEmail(email: string): Promise<any> {
  const query = "SELECT * FROM users WHERE email = $1";
  const rows = await db(query, [email]);
  return rows[0];
}
