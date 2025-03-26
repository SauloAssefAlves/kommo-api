import { db } from "../config/database.js";
import CryptoJS from "crypto-js";

const ClienteController = {
  async cadastrarCliente(req, res) {
    try {
      const { nome, token } = req.body;

      // Verifica se o cliente já existe
      const [clienteExistente] = await db(
        "SELECT * FROM clientes WHERE nome = ?",
        [nome]
      );
      if (clienteExistente.length > 0) {
        return res.status(400).json({ error: "Cliente já cadastrado." });
      }

      // Insere o cliente no banco de dados
      const [result] = await db(
        "INSERT INTO clientes (nome, token) VALUES (?, ?)",
        [nome, token]
      );

      res.status(201).json({ id: result.insertId, nome });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao cadastrar cliente." });
    }
  },
  async listarClientes(req, res) {
    try {
      const clientes = await db("SELECT * FROM clientes");
      const secretKey = process.env.SECRET_KEY as string;

      const result = clientes.map((cliente) => {
        const decryptedToken = CryptoJS.AES.decrypt(
          cliente.token,
          secretKey
        ).toString(CryptoJS.enc.Utf8);
        return { ...cliente, token: decryptedToken };
      });

      res.status(201).json({ result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes." });
    }
  },
  
  async cadastrarUnidadeTintim(req, res) {
    const { empresa_id, nome, todas_unidades } = req.body;
    try {
      const query = `
      INSERT INTO tintim_unidades (empresa_id, nome, todas_unidades)
      VALUES (
        $1, 
        CASE 
          WHEN $2 = TRUE THEN (SELECT nome FROM clientes WHERE id = $1) 
          ELSE $3 
        END, 
        $2
      )
        ON CONFLICT (empresa_id, nome) DO NOTHING
      RETURNING *;
    `;

      const values = [empresa_id, todas_unidades, nome];

      const result = await db(query, values);
      if (result.length === 0) {
        return res
          .status(409)
          .json({ message: "Unidade já cadastrada", success: false });
      }
      return res.status(201).json({
        message: "Unidade cadastrada com sucesso",
        success: true,
        unidade: result,
      });

    } catch (err) {
      console.error("Erro ao cadastrar unidade:", err);
      return res.status(500).json({
        message: "Erro no servidor",
        success: false,
        error: err.message,
      });
    }
  },
};

export default ClienteController;
