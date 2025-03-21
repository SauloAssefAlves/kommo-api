import { Router, Request, Response } from "express";
import { ClienteController } from "../controllers/cliente.controller.js";
import { ClienteModel } from "../models/cliente.models.js";
import { TintimWebhookController } from "../controllers/tintimWebhook.controller.js";
import { getClientesTintim } from "../config/database.js";

const router = Router();

const clientes = await getClientesTintim();

const cliente = new ClienteModel(
  "saulotestes",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjJlOGM4ZWY5YWZlYmY0YjU5MWY0MjZiMmI1NzlhZjQ2ZjVkMjFlYTMzZjM4Zjg2NDNkMzM1M2Y3NGNiYjJkYzAxMDNhNTJkYzVjNjRlMWRmIn0.eyJhdWQiOiJiMDM3ZGNhMC1jOTBkLTQ1ZDctYWIzZC01ZTEwMzYyMGMzNDQiLCJqdGkiOiIyZThjOGVmOWFmZWJmNGI1OTFmNDI2YjJiNTc5YWY0NmY1ZDIxZWEzM2YzOGY4NjQzZDMzNTNmNzRjYmIyZGMwMTAzYTUyZGM1YzY0ZTFkZiIsImlhdCI6MTc0MjMxMDE1NywibmJmIjoxNzQyMzEwMTU3LCJleHAiOjE3NDQ1MDI0MDAsInN1YiI6IjEyNzYxMDc1IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0MzAwMjU1LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiZWUyZTExNTgtZWI4MS00ZGUxLTgyMjQtOWMwMzVmOWY1NDc5IiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.JVLogZfR79oc1sP681VPqjf4qyS_VYRhZjmms2LRAUMfctYlO2sGNPLgK_azkGaO4mIj6HL6K7gLb4xw9vtWJCAGeL9XCSmTbtRCvp6pdfXGUU9CThYanP6y-59wWURcX0TarWNdl7gpaoOeHZ7MeoJ_DE8l3zvO7jJGRd7WjDE4gRtZDrywGhQrywvPyXIWasbWXBUD5DCHDGbHwbxzcMLhTxj9cPZmbt6UGkNkU0QKM_2kxF3Zol2iTw3WlNKa0TL-mXs9MFws5jL4hCzA6viW06WbVEAvWp7NTG-mVmgyBF5ko9tt9MWBDiYpesz11WF_QJ9TDtWXsrjNTN_UVA"
);

clientes.forEach((cliente) => {
  const clienteModel = new ClienteModel(cliente.nome, cliente.token);

  // Rota POST para cada cliente
  router.post(
    `/${cliente.nome}`,
    async (req: Request, res: Response): Promise<any> => {
      try {
        // Processa o webhook
        await new TintimWebhookController(
          clienteModel
        ).atualizarFiledsWebhookTintim(req, res);

        // Log de sucesso
        console.log("🔍 Cliente:", cliente.nome);

        // Responde com sucesso
        return res
          .status(200)
          .json({ message: "✅ Webhook recebido com sucesso!!!!" });
      } catch (error) {
        // Log de erro
        console.error("❌ Erro ao buscar clientes:", error);

        // Responde com erro
        return res.status(500).json({ error: "Erro ao buscar clientes" });
      }
    }
  );
});
router.post("/clientes", async (req: Request, res: Response) => {
  try {
    await new TintimWebhookController(cliente).atualizarFiledsWebhookTintim(
      req,
      res
    );

    res.status(200).json({ message: "✅ Webhook recebido com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

export default router;
