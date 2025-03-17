import { Router, Request, Response } from "express";
import { ClienteController } from "../controllers/cliente.controller";
import { ClienteModel } from "../models/cliente.models";
import { TintimWebhookController } from "../controllers/tintimWebhook.controller";
import { getClientesTintim } from "../config/database";

const router = Router();

const clientes = await getClientesTintim();

const cliente = new ClienteModel(
  "saulotestes",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjZmZWE4ZTQ0YTkyNzliNWMyNTZlZTcwMGE1N2Q3ZTQ1MDA1NTQ5ODU2MTU4ZDY5NjAwODAxNWU2MzYzNTc5N2EyMTFiNGZkMGQwMmVkNTVlIn0.eyJhdWQiOiJiMDM3ZGNhMC1jOTBkLTQ1ZDctYWIzZC01ZTEwMzYyMGMzNDQiLCJqdGkiOiI2ZmVhOGU0NGE5Mjc5YjVjMjU2ZWU3MDBhNTdkN2U0NTAwNTU0OTg1NjE1OGQ2OTYwMDgwMTVlNjM2MzU3OTdhMjExYjRmZDBkMDJlZDU1ZSIsImlhdCI6MTc0MTgwMTg2NywibmJmIjoxNzQxODAxODY3LCJleHAiOjE3NDMxMjAwMDAsInN1YiI6IjEyNzYxMDc1IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0MzAwMjU1LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiNDYzYjE1ZTctNjQxYy00Nzk3LWJhNTYtYTcwNTUxMjExYmUyIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.lj1qi7Vjv9jOp_ukScYoQUr4cnBggciLar9RWd_p3BqH9eRqSxlP3X1YoN-QE20hGNFULtW8ywAWRvTmbN8QXi1bVw6qhDKNb582KftoVU828JUapJBF432u2COpkqXNhkGOJ3lM6gPEE-4UCcyQfigSbnY2acBRytysKRS7bUOvj6sQwepPsJ5ekfw1sg6nWEkxYeAIsG8skVB_ljkO_NY5-TEBR0day8Wbyzb5qmF9-Eu7HSVsdYALohspgwpAMGXi2F7CbngIdvHqQQjJJy9EvNAAZS6yJQC_JSqjwQ5ANnngxULmpUZsHn7EFJd1IWJ7Slfda-gRqY5nxItXBQ"
);

clientes.forEach((cliente) => {
  const clienteModel = new ClienteModel(cliente.nome, cliente.token);
  console.log("🔍 Cliente:", cliente.nome);
  router.post(`/${cliente.nome}`, async (req: Request, res: Response) => {
    try {
      // await new TintimWebhookController(clienteModel).atualizarFiledsWebhookTintim(
      //   req,
      //   res
      // );
     

      res.status(200).json({ message: "✅ Webhook recebido com sucesso!!!!" });
    } catch (error) {
      console.error("❌ Erro ao buscar clientes:", error);
      res.status(500).json({ error: "Erro ao buscar clientes" });
    }
  });
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
