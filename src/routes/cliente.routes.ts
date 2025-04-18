import { Router, Request, Response } from "express";
import ClienteController from "../controllers/cliente.controler.js";
import { authenticateToken } from "../auth/middleware.js";

const router = Router();


// ----------- Listagens -----------
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
router.get(
  "/listarClientePipelines/:id",
  authenticateToken,
  ClienteController.listarClientePipelinePeloId
);

router.get(
  "/listarPipelines/:id",
  authenticateToken,
  ClienteController.listarPipelinesPeloId
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
// ----------- CADASTROS -----------
router.post(
  "/cadastrar",
  authenticateToken,
  ClienteController.cadastrarCliente
);
router.post(
  "/cadastrarClientePipelines",
  authenticateToken,
  ClienteController.cadastrarClientePipelines
);
router.post(
  "/cadastrarUnidadeTintim",
  authenticateToken,
  ClienteController.cadastrarUnidadeTintim
);

// ----------- EXCLUIR -----------
router.delete(
  "/excluir/:id",
  authenticateToken,
  ClienteController.excluirCliente
);
router.delete(
  "/excluirClientePipeline/:id",
  authenticateToken,
  ClienteController.excluirClientePipeline
);

export default router;
