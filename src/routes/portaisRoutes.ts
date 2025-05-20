import { Router, Response, Request } from "express";
import { KommoModel } from "../models/kommo.models.js";
import { PortaisController } from "../controllers/portais.controller.js";
import { getClientesPortais } from "../config/database.js";

const router = Router();

// Função para atualizar as rotas dinamicamente
export async function atualizarRotasPortais() {
  const clientesPortais = await getClientesPortais();

  // Limpa todas as rotas existentes no router
  router.stack = [];

  clientesPortais.forEach((cliente) => {
    console.log("🔍", `/portais/${cliente.nome}`);

    const clienteModel = new KommoModel(cliente.cliente_nome, cliente.token);

    router.post(
      `/${cliente.nome}`,
      async (req: Request, res: Response): Promise<any> => {
        try {
          await new PortaisController(
            clienteModel
          ).atualizarFiledsWebhookPortais(req, res, cliente);
          console.log("🔍 Cliente:", cliente.nome);
          return res.status(200).json({
            success: true,
            message: "Webhook do portal processado com sucesso",
          });
        } catch (error) {
          console.log("X Cliente:", cliente.nome);
          console.log("Erro:", error);
          return res.status(500).json({
            success: false,
            message: "Erro ao processar o webhook do portal",
          });
        }
      }
    );
  });
}

// Chamada inicial para configurar as rotas
atualizarRotasPortais().catch((error) =>
  console.error("Erro ao atualizar rotas:", error)
);

export default router;
