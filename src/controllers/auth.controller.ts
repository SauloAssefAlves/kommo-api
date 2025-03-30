import CryptoJS from "crypto-js";
import {
  findUserByEmail,
  comparePassword,
  generateToken,
  hashPassword,
} from "../auth/services";
import { db } from "../config/database.js";

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  // Validação dos dados
  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  // Verificar se o usuário já existe
  const checkUserQuery = "SELECT * FROM users WHERE email = $1";
  const existingUser = await db(checkUserQuery, [email]);

  if (existingUser.length > 0) {
    return res.status(400).json({ message: "Usuário já existe" });
  }

  // Criptografar a senha
  const hashedPassword = await hashPassword(password);

  // Inserir o usuário no banco de dados
  const insertUserQuery =
    "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *";
  const result = await db(insertUserQuery, [email, hashedPassword]);

  // Retornar resposta
  if (result.length > 0) {
    return res.status(201).json({
      message: "Usuário registrado com sucesso",
      user: result,
    });
  } else {
    return res.status(500).json({ message: "Erro ao registrar usuário" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Encontre o usuário pelo email
  const user = await findUserByEmail(email);
  if (!user) {
    res.status(400).json({ message: "Usuário não encontrado" });
    return;
  }

  // Verifique se a senha está correta
  const passwordMatch = await comparePassword(password, user.password);
  console.log(passwordMatch);
  if (!passwordMatch) {
    res.status(400).json({ message: "Senha incorreta" });
    return;
  }

  // Gere o token
  const token = generateToken(user);

  // Retorne a resposta com o token
  res.status(200).json({ message: "Login bem-sucedido", token });
};

export { registerUser, loginUser };
