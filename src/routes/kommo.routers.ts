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
  const subdomain = "stagemotors";
  const tokenDescriptografado =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjJhNWE5YTE1OWYzMWIzZThlZTA4OGZmYWE2MTJlNmU2MTQ3YmQ3YzlkYzU3NTFhZTZmOThkNzc4Y2VjZjAyNTM5ZGRjNzQ5MzQ3Mzk4Y2U1In0.eyJhdWQiOiJmNzBkMzkxNC1mMDY2LTRlMDMtYWFlMi03NDkzZDkxYWU3YjYiLCJqdGkiOiIyYTVhOWExNTlmMzFiM2U4ZWUwODhmZmFhNjEyZTZlNjE0N2JkN2M5ZGM1NzUxYWU2Zjk4ZDc3OGNlY2YwMjUzOWRkYzc0OTM0NzM5OGNlNSIsImlhdCI6MTc1MDc4MDU3NywibmJmIjoxNzUwNzgwNTc3LCJleHAiOjE4MDQ4MDk2MDAsInN1YiI6IjEwMjgxNTk5IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0Nzg1Nzc5LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiNDE0YjFmYWMtNDM2ZC00OTIyLTgxNDItNjFhMTE5MGUzNmQyIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.JkgZc1E3vDahpnn8NdICg5bMrRm2R82u9nlJhoXH_vExTIN8wwRpVTPYPwT96qVhcIGeEyRxcjII026eIis0I3XwrqWcL09SiZoxS7ijFHefh8FSQovL-rrc7viUfPlzAph0KYdn4MME61xWbBfcPLw81DHzBdCUx2JGWlAKPx-1ffVlgv60BJcMBuMEvxaTj4uAAYKjHu7E5MR_qFEX8QhyBzXTNiQmR4MK7RJ73XFrAwWMd48Gz22d5JFz-o2wZlref3pxz1yMjONTWcpcbHhCRJZ20odA0QraKEcMUOySVEoBHQp3t1Uwh2NFT5rsAs37ZY8viVN6qZGRkddePQ";
  const response = await kommoController.cadastrarPipelines(
    subdomain as string,
    tokenDescriptografado as string
  );

  res.status(201).json({ data: response });
});
export default router;
