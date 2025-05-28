import { Router, Request, Response } from "express";
import { KommoController } from "../controllers/kommo.controller.js";
import { KommoModel } from "../models/kommo.models.js";
import { TintimWebhookController } from "../controllers/tintimWebhook.controller.js";
import { getClientesTintim } from "../config/database.js";

const router = Router();
export async function atualizarRotasTintim() {
  const clientes = await getClientesTintim();

  // Limpa todas as rotas existentes no router
  router.stack = [];

  clientes.forEach((cliente) => {
    console.log("🔍", `/tintimWebhook/${cliente.nome}`);

    const clienteModel = new KommoModel(cliente.cliente_nome, cliente.token);

    router.post(
      `/${cliente.nome}`,
      async (req: Request, res: Response): Promise<any> => {
        try {
          await new TintimWebhookController(
            clienteModel
          ).atualizarFiledsWebhookTintim(req, res, cliente);
          console.log("🔍 Cliente:", cliente.nome);
          return res.status(200).json({
            success: true,
            message: "Webhook processado com sucesso",
          });
        } catch (error) {
          console.log("X Cliente:", cliente.nome);
          console.log("Erro:", error);
          return res.status(500).json({
            success: false,
            message: "Erro ao processar o webhook",
          });
        }
      }
    );
  });
}

// Chamada inicial para configurar as rotas
atualizarRotasTintim().catch((error) =>
  console.error("Erro ao atualizar rotas:", error)
);

export default router;
