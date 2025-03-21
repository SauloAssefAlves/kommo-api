import { Router, Request, Response } from "express";
import { ClienteController } from "../controllers/cliente.controller.js";
import { ClienteModel } from "../models/cliente.models.js";
import { TintimWebhookController } from "../controllers/tintimWebhook.controller.js";
import { getClientesTintim } from "../config/database.js";

const router = Router();

const clientes = await getClientesTintim();


clientes.forEach((cliente) => {
  
  const clienteModel = new ClienteModel(cliente.nome, cliente.token);

  router.post(
    `/${cliente.nome}`,
    async (req: Request, res: Response): Promise<any> => {
      try {
        await new TintimWebhookController(
          clienteModel
        ).atualizarFiledsWebhookTintim(req, res);

        console.log("🔍 Cliente:", cliente.nome);

        return res
          .status(200)
          .json({ message: "✅ Webhook recebido com sucesso!!!!" });
      } catch (error) {
        console.error("❌ Erro ao buscar clientes:", error);

      }
    }
  );
});


export default router;
