"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/tintimWebhook", (req, res) => {
    try {
        const webhookData = req.body;
        console.log("📩 Webhook recebido:", JSON.stringify(webhookData, null, 2));
        res.status(200).json({ message: "✅ Webhook recebido com sucesso!" });
    }
    catch (error) {
        console.error("❌ Erro ao processar webhook:", error);
        res.status(500).json({ error: "Erro ao processar webhook" });
    }
});
exports.default = router;
