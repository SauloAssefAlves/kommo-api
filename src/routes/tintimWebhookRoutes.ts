import { Router, Request, Response } from "express";
import { KommoController } from "../controllers/kommo.controller.js";
import { KommoModel } from "../models/kommo.models.js";
import { TintimWebhookController } from "../controllers/tintimWebhook.controller.js";
import { getClientesTintim } from "../config/database.js";

const router = Router();
export async function atualizarRotasTintim() {
  const clientes = await getClientesTintim();

  // Remove duplicates (if any)
  const uniqueClientes = Array.from(
    new Map(clientes.map((c) => [c.nome, c])).values()
  );

  // Limpa todas as rotas existentes no router
  router.stack = [];

  const activeControllers = new WeakMap();

  uniqueClientes.forEach((cliente) => {
    console.log("🔍", `/tintimWebhook/${cliente.nome}`);

    router.post(`/${cliente.nome}`, async (req, res) => {
      const controller = new TintimWebhookController(
        cliente.nome,
        cliente.token
      );
      activeControllers.set(controller, true);

      try {
        await controller.atualizarFiledsWebhookTintim(req, res, cliente);
      } finally {
        activeControllers.delete(controller);
      }
    });
  });
}

// Chamada inicial para configurar as rotas
atualizarRotasTintim().catch((error) =>
  console.error("Erro ao atualizar rotas:", error)
);

export default router;
