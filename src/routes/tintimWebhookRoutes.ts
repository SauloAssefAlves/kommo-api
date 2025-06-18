import { Router, Request, Response } from "express";
import { KommoController } from "../controllers/kommo.controller.js";
import { KommoModel } from "../models/kommo.models.js";
import { TintimWebhookController } from "../controllers/tintimWebhook.controller.js";
import { getClientesTintim } from "../config/database.js";

const router = Router();
// Adicione no topo do arquivo
const activeControllers = new Map<string, TintimWebhookController>();

export async function atualizarRotasTintim() {
  const clientes = await getClientesTintim();

  // Limpa todas as rotas existentes no router
  router.stack = [];

  // Destroi controladores antigos
  activeControllers.forEach((controller) => {
    if (typeof controller.destroy === "function") controller.destroy();
  });
  activeControllers.clear();

  // Remove duplicados
  const uniqueClientes = Array.from(
    new Map(clientes.map((c) => [c.nome, c])).values()
  );

  uniqueClientes.forEach((cliente) => {
    console.log("🔍", `/tintimWebhook/${cliente.nome}`);

    router.post(`/${cliente.nome}`, async (req, res) => {
      const controller = new TintimWebhookController(
        cliente.nome,
        cliente.token
      );
      activeControllers.set(cliente.nome, controller);

      try {
        await controller.atualizarFiledsWebhookTintim(req, res, cliente);
      } finally {
        activeControllers.delete(cliente.nome);
      }
    });
  });
}

// Chamada inicial para configurar as rotas
atualizarRotasTintim().catch((error) =>
  console.error("Erro ao atualizar rotas:", error)
);

export default router;
