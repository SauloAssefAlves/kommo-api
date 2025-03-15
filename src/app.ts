import express from "express";
import cors from "cors";
import tintimWebhookRoutes from "./routes/tintimWebhookRoutes";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/tintimWebhook", tintimWebhookRoutes);

console.log("🚀 Server started");

export default app;
