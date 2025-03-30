import { Router, Request, Response } from "express";
import ClienteController from "../controllers/cliente.controler.js";
import { authenticateToken } from "../auth/middleware.js";

const router = Router();

router.get("/listar", authenticateToken, ClienteController.listarClientes);
router.get("/listarPeloNome/:nome", ClienteController.listarClientePeloNome);
router.get("/listarPeloId/:id", ClienteController.listarClientePeloId);
router.post("/listarUnidades", ClienteController.listarUnidadesKommo);
router.get("/listarTintim", ClienteController.listarUnidadesTintim);
router.post(
  "/cadastrarUnidadeTintim",
  ClienteController.cadastrarUnidadeTintim
);
router.post("/cadastrar", ClienteController.cadastrarCliente);

export default router;
