import { Router, Request, Response } from "express";
import ClienteController from "../controllers/cliente.controler.js";
import { KommoController } from "../controllers/kommo.controller.js";
import { authenticateToken } from "../auth/middleware.js";

const router = Router();
const kommoController = new KommoController();

// ----------- LISTAGENS -----------
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

router.get(
  "/listarPortais",
  authenticateToken,
  ClienteController.listarPortais
);

router.get(
  "/listarMonitoamentoTintim/:id?",
  authenticateToken,
  ClienteController.listarMonitoramentoTintim
);

router.get(
  "/listarMonitoamentoPortais/:id?",
  authenticateToken,
  ClienteController.listarMonitoramentoPortais
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
router.post(
  "/cadastrarPortais",
  authenticateToken,
  ClienteController.cadastrarClientePortais
);
// ----------- EDITS -----------
router.put(
  "/editarCliente/:id",
  authenticateToken,
  ClienteController.editarCliente
);
router.put(
  "/editarTintim/:id",
  authenticateToken,
  ClienteController.editarTintim
);
router.put(
  "/editarPortal/:id",
  authenticateToken,
  ClienteController.editarPortais
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
router.delete(
  "/excluirClienteTintim/:id",
  authenticateToken,
  ClienteController.excluirClienteTintim
);
router.delete(
  "/excluirClientePortais/:id",
  authenticateToken,
  ClienteController.excluirClientePortais
);

export default router;
