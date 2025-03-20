import express from "express";
import cors from "cors";
import tintimWebhookRoutes from "./routes/tintimWebhookRoutes.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/tintimWebhook", tintimWebhookRoutes);
app.get("/teste", (req, res) => {
    res.send("🚀 Servidor rodando!");
});
console.log("🚀 Server started");
export default app;
