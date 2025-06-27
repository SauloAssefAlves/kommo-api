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
  const subdomain = "cardosogarage";
  const tokenDescriptografado =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImE3NDAyN2JjNjczNjdhOGFjZDRhOTEwMjM5MDRiNDQ1OTJiNzljZTE2M2JmMzdmODgyMzcwYWM2Zjk4YWU1YWMwOGY2NWM2MzFmZDM1Njc1In0.eyJhdWQiOiI4ZmE2NTY4NC1mZjRmLTQzMzEtOGRhOC0yZDUwZjViMDY1Y2QiLCJqdGkiOiJhNzQwMjdiYzY3MzY3YThhY2Q0YTkxMDIzOTA0YjQ0NTkyYjc5Y2UxNjNiZjM3Zjg4MjM3MGFjNmY5OGFlNWFjMDhmNjVjNjMxZmQzNTY3NSIsImlhdCI6MTc1MTAzNTUwOCwibmJmIjoxNzUxMDM1NTA4LCJleHAiOjE4MTYzMDA4MDAsInN1YiI6IjEwMjgxNTk5IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODAxNjAzLCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiYzk0ZDM2MmQtYzNlOC00NGJjLWJjZDUtN2IwYmNkODg3YmQ3IiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.IEjyI1kxQEf846ito1KgY9cSCWz3jSn6FSfvE9z_o9kHBDkxkG_gDy1baCp9sgHBkY-fKrTUQoNxsacbMOq8-2L6GiJec0mlycavXHzrk36_B93mMIjeWxJT8ykJXwQaao5_qcVO_av7dj0W30JJo5FAEOfjwtgGT4x13MmVKb3FAukXF3ZJcdrDaWtV-QAqoT2xXmqwkLzICBBa815Hbl_x6c7QbCD_tu-QSQ8LVpKFcQJ0lD3p0hjH8xl5E6QawedTsqgu2XOH8HaiZ_bhhYEsu4k3P--c0N13-DRGKHC3lVdATFn3Qek8sg3_2-mvrGsTelNcFYDeizUKSsrNOg";
  const response = await kommoController.cadastrarPipelines(
    subdomain as string,
    tokenDescriptografado as string
  );

  res.status(201).json({ data: response });
});
export default router;
