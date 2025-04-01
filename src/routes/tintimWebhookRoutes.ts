import { Router, Request, Response } from "express";
import { KommoController } from "../controllers/kommo.controller.js";
import { KommoModel } from "../models/kommo.models.js";
import { TintimWebhookController } from "../controllers/tintimWebhook.controller.js";
import { getClientesTintim } from "../config/database.js";

const router = Router();

const clientes = await getClientesTintim();
clientes.forEach((cliente) => {
  console.log("🔍", `/tintimWebhook/${cliente.nome}`);
});

clientes.forEach((cliente) => {
  const clienteModel = new KommoModel(cliente.nome, cliente.token);

  router.post(
    `/${cliente.nome}`,
    async (req: Request, res: Response): Promise<any> => {
      try {
        await new TintimWebhookController(
          clienteModel
        ).atualizarFiledsWebhookTintim(req, res, cliente);
        if (!res.headersSent) {
          return res.status(200).json({
            success: true,
            message: "Webhook processado com sucesso",
          });
        }
        console.log("🔍 Cliente:", cliente.nome);
      } catch (error) {
        if (!res.headersSent) {
          return res.status(500).json({ error: "Erro ao processar o webhook" });
        }
        console.error("❌ Erro ao buscar clientes:", error);
      }
    }
  );
});

export default router;
