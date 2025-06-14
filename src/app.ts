import express from "express";
import cors from "cors";
import tintimWebhookRoutes from "./routes/tintimWebhookRoutes.js";
import portaisRoutes from "./routes/portaisRoutes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import loginRoute from "./routes/auth.routes.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", loginRoute);

app.use("/tintimWebhook", tintimWebhookRoutes);
app.use("/portais", portaisRoutes);
app.use("/cliente", clienteRoutes);

app.get("/teste", (req, res) => {
  res.send("🚀 Servidor rodando!");
});



export default app;
