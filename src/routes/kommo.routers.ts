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
  const subdomain = "sedacar";
  const tokenDescriptografado =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjNmOGMwYzU4MzFkYzU0ODJkMjhlM2EzNDM3MzJiYTIyNzg0ZWYzN2MyZmQyODlhMThhODY0NDIyNDJmZThiYzE2NjFhOGQwMjZkZmFiNTRmIn0.eyJhdWQiOiJhY2Q3MjA4YS0wMzVjLTQxNWQtOWJmNi05NmNjZTgwMzMzMWIiLCJqdGkiOiIzZjhjMGM1ODMxZGM1NDgyZDI4ZTNhMzQzNzMyYmEyMjc4NGVmMzdjMmZkMjg5YTE4YTg2NDQyMjQyZmU4YmMxNjYxYThkMDI2ZGZhYjU0ZiIsImlhdCI6MTc1MTg5OTg1MywibmJmIjoxNzUxODk5ODUzLCJleHAiOjE4MDkyMTYwMDAsInN1YiI6IjEwMjgxNTk5IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODQ1ODM1LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiOTVmMDkzYzQtMGFjYi00NGUxLWJkZDEtYWY3YjE0MjI3NDNkIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.fPsc3EoM7hLfHk40iFrgrcIxj0MiQyE2XveptZWbJ0C5w_DHDgPjW8qUyfgvAYzhYZ5n_3yQK8FsfqWiUfUpGTwkdpLUhWgacz-ozrZCncWyFWwa2AJZBX6W5McPe3ngJ6OeXRA0VOZaY1eWsA52RHNEb7DC3OzXJWxwsbGq3yLjR5_AQCXvokIQynZmFzbh2Gr_t7SEKb-vJuI59qAMWgFxmFziV7B1eXd0Oxq3TrZllhuS77h2JdV-TIN5EeVQj8v0XobLL8_u7gUY3KuWMx9QNLZZowYwPaIjrnGy0_Z7urpFuKpu02FeEjiSWP0Tlfz79kOIRxw5pJPnWYXWgw";
  const response = await kommoController.cadastrarPipelines(
    subdomain as string,
    tokenDescriptografado as string
  );

  res.status(201).json({ data: response });
});

// ----------- FORTALEZA -----------

router.post("/buscarCpfSws", async (req: Request, res: Response) => {
  // Extrai o id do lead do formato de entrada esperado
  const leadIdFromBody = req.body?.[0]?.leads?.add?.[0]?.id;
  const lead_id = leadIdFromBody;

  try {
    const cliente = await db("select nome, token from clientes where id = 28");
    console.log("Cliente encontrado:", cliente);
    const tokenDescriptografado = descriptografarToken(cliente[0].token);
    const subdomain = cliente[0].nome;
    const kommoCliente = { subdomain, tokenDescriptografado };

    console.log(req.body)
    const response = await kommoController.buscarCpfSws(
      kommoCliente,
      lead_id
    );

    res.status(200).json({ data: response });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar CPF no SWS" });
  }
});
export default router;
