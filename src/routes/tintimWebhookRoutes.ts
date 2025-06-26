import { Router } from "express";
const processingQueue: Promise<void> = Promise.resolve();

async function enqueueProcessing<T>(fn: () => Promise<T>): Promise<T> {
  // Encadeia a função ao final da fila
  let result: Promise<T>;
  const last = (processingQueue as any).last || processingQueue;
  (processingQueue as any).last = last.then(async () => {
    result = fn();
    try {
      await result;
    } catch {}
  });
  if ((processingQueue as any).last !== last) {
    console.log("⏳ Webhook aguardando na fila...");
  }
  await (processingQueue as any).last;
  return result;
}
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
      let controller: TintimWebhookController | undefined;

      await enqueueProcessing(async () => {
        controller = new TintimWebhookController(cliente.nome, cliente.token);
        activeControllers.set(cliente.nome, controller);
        try {
          return await controller.atualizarFiledsWebhookTintim(req, res, cliente);
        } finally {
          if (controller) {
            controller.destroy();
          }
          activeControllers.delete(cliente.nome);
        }
      });
    });
  });
}

// Chamada inicial para configurar as rotas
atualizarRotasTintim().catch((error) =>
  console.error("Erro ao atualizar rotas:", error)
);

export default router;
