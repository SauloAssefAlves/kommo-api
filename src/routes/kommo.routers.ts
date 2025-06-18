import { Router, Request, Response } from "express";
import { KommoController } from "../controllers/kommo.controller.js";
import { authenticateToken } from "../auth/middleware.js";
import { db, descriptografarToken } from "../config/database.js";

const router = Router();
const kommoController = new KommoController();

// ----------- LISTAGENS -----------

// ----------- CADASTROS -----------
router.post(
  "/cadastrarCustomFields/:id",
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const cliente = await db("select nome, token from clientes where id = $1", [
      id,
    ]);
    console.log("Cliente encontrado:", cliente);
    const tokenDescriptografado = descriptografarToken(cliente[0].token);
    const subdomain = cliente[0].nome;
    console.log("Token descriptografado:", tokenDescriptografado);
    const response = await kommoController.cadastrarCustomFields(
      subdomain as string,
      tokenDescriptografado as string
    );
    res.status(201).json({ data: response });
  }
);
router.post("/cadastrarPipelines/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  // const cliente = await db("select nome, token from clientes where id = $1", [
  //   id,
  // ]);
  // console.log("Cliente encontrado:", cliente);
  // const tokenDescriptografado = descriptografarToken(cliente[0].token);
  // const subdomain = cliente[0].nome;
  // console.log("Token descriptografado:", tokenDescriptografado);
  const subdomain = "eulsmotors";
  const tokenDescriptografado =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImU2YWFjZmJkNzFiZDU3OTM1MDdkZDg3ZWFjY2QyNTRkNjA2ZjU4MzVjYTA3YzkzNTY1ZDA1ZGMxNzAyNTZlYzEzNGMxMzNkYjZjNjdiZWM0In0.eyJhdWQiOiJhNGQ1YmU4Ny0zNTVmLTQ1ZDItYWI1NS0yODJhYzE2MjJkOGMiLCJqdGkiOiJlNmFhY2ZiZDcxYmQ1NzkzNTA3ZGQ4N2VhY2NkMjU0ZDYwNmY1ODM1Y2EwN2M5MzU2NWQwNWRjMTcwMjU2ZWMxMzRjMTMzZGI2YzY3YmVjNCIsImlhdCI6MTc1MDEwOTY3MCwibmJmIjoxNzUwMTA5NjcwLCJleHAiOjE4MDQ4MDk2MDAsInN1YiI6IjEwMjgxNTk5IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0NzUxMzU5LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiZjliNGI3NmQtYjM5Mi00Mzk3LWFhMTMtYTY1YWRlMWUzOTBhIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.hO3Ep_sdX_5KWCjzYNRD1hyqYV_q4kL3jWojObglsO0anXs8vRQhfdXZ7IPe4kJc9v_xCR381lA8DAV3xT1U_voX5g_Z9WbkGH4BsBzYuNLiLapPBiroFMVU5wPZCHbKxQNyjtDMkfVXjc-ln0Y_6QYrZcQ4Gq0ytnRAkes5LUVwD4hvyeTZXtMfDfrPT9TNclGNPwNXK2nmKTXLr1ZFEdqralZilyJG4l5ftcTegPgMKK5gN_nSPWeD4DXboZB0TwUQpW2CzETARS0o23ypClbDtyFZfarqhp9M8m6lOyItwu-tcZAu4mngkxNXtnYP8ZD6nmobv4JrKXO5K7BF7w";
  const response = await kommoController.cadastrarPipelines(
    subdomain as string,
    tokenDescriptografado as string
  );

  res.status(201).json({ data: response });
});
export default router;
