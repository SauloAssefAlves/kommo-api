import { Router, Request, Response } from "express";
import ClienteController from "../controllers/cliente.controler.js";

const router = Router();

router.get("/listar", ClienteController.listarClientes);
router.post("/cadastrarUnidadeTintim", ClienteController.cadastrarUnidadeTintim);
router.post("/cadastrar", ClienteController.cadastrarCliente);

export default router;
