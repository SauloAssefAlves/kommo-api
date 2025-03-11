import { Router, Request, Response } from "express";

const router = Router();

router.post("/tintimWebhook", (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    console.log("📩 Webhook recebido:", JSON.stringify(webhookData, null, 2));

    res.status(200).json({ message: "✅ Webhook recebido com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    res.status(500).json({ error: "Erro ao processar webhook" });
  }
});

export default router;
