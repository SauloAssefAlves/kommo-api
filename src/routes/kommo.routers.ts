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
  const subdomain = "worldcarfortaleza";
  const tokenDescriptografado =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImVlOTVjN2Y1OGE3MmEwMDViY2U2YzczZDVlNTc2MjdiMWEwOWYyNGVhODBlYTUxZTg4YWZmN2U1ZDc1OGUzNDBjNGQ0ZTA5ODIwOGM5YTlkIn0.eyJhdWQiOiIwYmEyYTRmMS0xMmZmLTQ1OTctOTgxOC1kNDE4NDRhMzJhODkiLCJqdGkiOiJlZTk1YzdmNThhNzJhMDA1YmNlNmM3M2Q1ZTU3NjI3YjFhMDlmMjRlYTgwZWE1MWU4OGFmZjdlNWQ3NThlMzQwYzRkNGUwOTgyMDhjOWE5ZCIsImlhdCI6MTc1MjAwMjQ1NywibmJmIjoxNzUyMDAyNDU3LCJleHAiOjE4MzY4NjQwMDAsInN1YiI6IjEwMjgxNTk5IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODUzNTg3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiZGRkNjFlNDgtY2QwNy00YmI0LTk4Y2YtYWEyNzEyOThhODYzIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.P5dE9eJdw4cY9vyych9TDqeDL49wUXjiamApV9RvNmenlaRxNYlL4OVLN3F_tKOZToKww7Cd5Y_L4EGLYwXEsgtu1R9TyS88tEVL_egerGeVFxyJuFKjwiQwJs4CHDmizlPs9JhDySZIfN0iEa3LLcilG0UlVDqSMzF3A15KDnAZJkK2F53ldoHj4M2ZOqr5voxz9u4kWa7M5Ux4_j2r9px5gKdQGtuBLicEbngYZnBv1-RDRD35-2oFcAix1Vij-GKmweXvo220Viafmzo-fIhwQ9vg5FU-mUwaNE5jWK_jfu4L1aojVYPRhurjAS30kRD4DYt20ekvFno4Qtlv9g";
  const response = await kommoController.cadastrarPipelines(
    subdomain as string,
    tokenDescriptografado as string
  );

  res.status(201).json({ data: response });
});

// ----------- FORTALEZA -----------

router.post("/buscarCpfSws/:lead_id", async (req: Request, res: Response) => {
  // Extrai o id do lead do formato de entrada esperado
  console.log("Buscando CPF no SWS para o lead:", req.params);

  const lead_id = req.params.lead_id;

  try {
    const cliente = await db("select nome, token from clientes where id = 28");
    console.log("Cliente encontrado para SWS:", cliente[0].nome);
    const tokenDescriptografado = descriptografarToken(cliente[0].token);
    const subdomain = cliente[0].nome;
    const kommoCliente = { subdomain, tokenDescriptografado };

    const response = await kommoController.buscarCpfSws(
      kommoCliente,
      Number(lead_id)
    );

    res.status(200).json({ data: response });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar CPF no SWS" });
  }
});

// ----------- Vox2You -----------

interface Lead {
  nome: string;
  telefone: number;
  unidade: string;
  cursodeinteresse: string;
  midia: string;
  origem: string;
  email: string;
  profissao: string;
  utm_content: string;
  utm_medium: string;
  utm_campaign: string;
  utm_source: string;
  utm_term: string;
  utm_referrer: string;
  referrer: string;
  gclientid: string;
  gclid: string;
  fbclid: string;
}

router.post("/cadastrarLeadVox2you", async (req: Request, res: Response) => {
  // Extrai o id do lead do formato de entrada esperado
  console.log("Cadastrando lead no Vox2You:", req.body);

  const {
    lead,
    info,
    subdomain,
    funilId,
    contaId,
  }: {
    lead: Lead;
    info: any;
    subdomain: string;
    funilId: number;
    contaId: number;
  } = req.body;

  try {
    const cliente = await db(
      "select nome, token from clientes where nome = $1",
      [subdomain]
    );
    console.log("Cliente encontrado", cliente[0].nome);
    const tokenDescriptografado = descriptografarToken(cliente[0].token);
    const kommoCliente = { subdomain, tokenDescriptografado };
    let valido = false;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: "Bearer " + tokenDescriptografado,
      },
    };

    try {
      const response = await fetch(`https://${subdomain}.kommo.com/api/v4/account`, options);
      const res = await response.json();
      if (res.id === contaId) {
      valido = true;
      }
    } catch (err) {
      console.error("Erro ao validar o contaID:", err);
      res.status(500).json({ error: "Erro ao validar o contaID" });
      return;
    }
    if (valido) {
      const response = await kommoController.cadastrarLeadVox2You(
        kommoCliente,
        lead,
        info,
        funilId,
      );

      res.status(200).json({ data: response });
    }else{
      res.status(403).json({ error: "Conta ID inválido" });
    }

  } catch (error) {
    res.status(500).json({ error: "Erro ao cadastrar lead no Vox2You" });
  }
});
export default router;
