import express from "express";
import cors from "cors";
import tintimWebhookRoutes from "./routes/tintimWebhookRoutes.js";
import portaisRoutes from "./routes/portaisRoutes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import loginRoute from "./routes/auth.routes.js";
import kommoRoute from "./routes/kommo.routers.js";

const app = express();

app.use(cors());
app.use(express.json()); // Para application/json
app.use(express.urlencoded({ extended: true })); // ✅ Para application/x-www-form-urlencoded
app.use("/auth", loginRoute);

app.use("/tintimWebhook", tintimWebhookRoutes);
app.use("/portais", portaisRoutes);
app.use("/cliente", clienteRoutes);
app.use("/kommo", kommoRoute);

app.post("/teste", (req, res) => {
  console.log("Body:", req.body);
  console.log("Query:", req.query);
  console.log("Headers:", req.headers);
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  res.send("Inspeção feita");
});

export default app;
