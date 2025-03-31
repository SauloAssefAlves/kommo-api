import { Router, Request, Response } from "express";
import ClienteController from "../controllers/cliente.controler.js";
import { authenticateToken } from "../auth/middleware.js";

const router = Router();

router.get("/listar", authenticateToken, ClienteController.listarClientes);
router.get(
  "/listarPeloNome/:nome",
  authenticateToken,
  ClienteController.listarClientePeloNome
);
router.get(
  "/listarPeloId/:id",
  authenticateToken,
  ClienteController.listarClientePeloId
);
router.post(
  "/listarUnidades",
  authenticateToken,
  ClienteController.listarUnidadesKommo
);
router.get(
  "/listarTintim",
  authenticateToken,
  ClienteController.listarUnidadesTintim
);
router.post(
  "/cadastrarUnidadeTintim",
  authenticateToken,
  ClienteController.cadastrarUnidadeTintim
);
router.post(
  "/cadastrar",
  authenticateToken,
  ClienteController.cadastrarCliente
);

export default router;
