import { Router, Response, Request } from "express";
import { KommoModel } from "../models/kommo.models.js";
import { PortaisController } from "../controllers/portais.controller.js";
import { getClientesPortais } from "../config/database.js";

const router = Router();



const clientesPortais =  await getClientesPortais();


clientesPortais.forEach((cliente) => {
  console.log("🔍", `/portais/${cliente.nome}`);
});

clientesPortais.forEach((cliente) => {
  const clienteModel = new KommoModel(cliente.cliente_nome, cliente.token);

  router.post(
    `/${cliente.nome}`,
    async (req: Request, res: Response): Promise<any> => {
      try {
        console.log("🔍", req.body);
        await new PortaisController(clienteModel).atualizarFiledsWebhookPortais(
          req,
          res,
          cliente
        );
        console.log("🔍 Cliente:", cliente.nome);
        return res.status(200).json({
          success: true,
          message: "Webhook do portal processado com sucesso",
        });
      } catch (error) {
        console.log("X Cliente:", cliente.nome);
        return res.status(500).json({
          success: false,
          message: "Erro ao processar o webhook do portal",
        });
      }
    }
  );
});

export default router;
