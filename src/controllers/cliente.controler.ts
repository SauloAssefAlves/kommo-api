import { db } from "../config/database.js";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const ClienteController = {
  async cadastrarCliente(req, res) {
    try {
      const { nome, token } = req.body;
      const secretKey = process.env.SECRET_KEY;

      // Verifica se o cliente já existe
      const clientes = await db(
        "SELECT * FROM clientes WHERE nome = $1", // use $1 para parâmetros com PostgreSQL
        [nome]
      );
      if (clientes.length > 0) {
        return res.status(400).json({ error: "Cliente já cadastrado." });
      }
      const encryptedToken = CryptoJS.AES.encrypt(token, secretKey).toString();
      // Insere o cliente no banco de dados
      const [result] = await db(
        "INSERT INTO clientes (nome, token) VALUES ($1, $2) RETURNING *", // use $1 e $2 para parâmetros
        [nome, encryptedToken]
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

      const data = clientes.map((cliente) => {
        const decryptedToken = CryptoJS.AES.decrypt(
          cliente.token,
          secretKey
        ).toString(CryptoJS.enc.Utf8);
        return { ...cliente, token: decryptedToken };
      });

      res.status(201).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes." });
    }
  },

  async listarClientePeloNome(req, res) {
    try {
      const clientes = await db("SELECT * FROM clientes where nome = $1", [
        req.params.nome,
      ]);
      const secretKey = process.env.SECRET_KEY as string;

      const data = clientes.map((cliente) => {
        const decryptedToken = CryptoJS.AES.decrypt(
          cliente.token,
          secretKey
        ).toString(CryptoJS.enc.Utf8);
        return { ...cliente, token: decryptedToken };
      });

      res.status(201).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes." });
    }
  },
  async listarClientePeloId(req, res) {
    try {
      const clientes = await db("SELECT * FROM clientes where id = $1", [
        req.params.id,
      ]);
      const secretKey = process.env.SECRET_KEY as string;

      const data = clientes.map((cliente) => {
        const decryptedToken = CryptoJS.AES.decrypt(
          cliente.token,
          secretKey
        ).toString(CryptoJS.enc.Utf8);
        return { ...cliente, token: decryptedToken };
      });

      res.status(201).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes." });
    }
  },

  async listarClientePipelinePeloId(req, res) {
    try {
      const response = await db(
        "SELECT cl.*, c.nome as subdomain FROM cliente_pipelines cl inner join clientes c on c.id = cl.cliente_id where cl.cliente_id = $1",
        [req.params.id]
      );
      if (response.length === 0) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      const data = response.map((res) => {
        return { ...res };
      });

      res.status(201).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes." });
    }
  },

  async listarPipelinesPeloId(req, res) {
    try {
      const response = await db(
        "select nome, token  from clientes where id = $1",
        [req.params.id]
      );
      if (response.length === 0) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      const secretKey = process.env.SECRET_KEY as string;
      const decryptedToken = CryptoJS.AES.decrypt(
        response[0].token,
        secretKey
      ).toString(CryptoJS.enc.Utf8);
      const subdomain = response[0].nome;
      const pipelinesResponse = await axios.get(
        `https://${subdomain}.kommo.com/api/v4/leads/pipelines`, // Endpoint para buscar os pipelines
        {
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
          },
        }
      );
      // Verifica se a resposta contém os pipelines
      if (
        !pipelinesResponse.data._embedded ||
        !pipelinesResponse.data._embedded.pipelines
      ) {
        return res.status(404).json({ error: "Nenhum pipeline encontrado." });
      }
      const data = pipelinesResponse.data._embedded.pipelines.map(
        (pipeline) => {
          return {
            id: pipeline.id,
            nome: pipeline.name,
          };
        }
      );

      res.status(201).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes." });
    }
  },

  async cadastrarClientePipelines(req, res) {
    try {
      const { cliente_id, pipeline_id, nome } = req.body;

      if (!cliente_id || !pipeline_id || !nome) {
        return res.status(400).json({ error: "Dados inválidos." });
      }

      // Verificar se a pipeline já está cadastrada para esse cliente
      const existingPipeline = await db(
        "SELECT id FROM cliente_pipelines WHERE cliente_id = $1 AND pipeline_id = $2",
        [cliente_id, pipeline_id]
      );

      if (existingPipeline.length > 0) {
        return res.status(400).json({
          message: "Essa pipeline já está cadastrada para esse cliente.",
        });
      }

      // Inserir a nova pipeline
      await db(
        "INSERT INTO cliente_pipelines (cliente_id, pipeline_id, nome) VALUES ($1, $2, $3);",
        [cliente_id, pipeline_id, nome]
      );

      res.status(201).json({ message: "Pipeline cadastrada com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao cadastrar pipeline." });
    }
  },
  async listarUnidadesKommo(req, res) {
    try {
      // Recupera os dados de token e subdomínio do corpo da requisição
      const { token, subdomain } = req.body;

      if (!token || !subdomain) {
        return res
          .status(400)
          .json({ error: "Token e subdomínio são necessários" });
      }

      // Agora, busque as unidades do Kommo usando o token
      try {
        const customFieldsResponse = await axios.get(
          `https://${subdomain}.kommo.com/api/v4/leads/custom_fields`, // Endpoint para buscar os campos personalizados
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Filtra o custom field com o nome "unidades"
        const unidadesField =
          customFieldsResponse.data._embedded.custom_fields.find(
            (field) => field.name.toLowerCase() === "unidade"
          );
        if (!unidadesField) {
          return res.status(404).json({
            error: "Campo personalizado 'unidades' não encontrado.",
          });
        }
        const unidadesFieldId = unidadesField.id;

        const unidadesResponse = await axios.get(
          `https://${subdomain}.kommo.com/api/v4/leads/custom_fields/${unidadesFieldId}`, // Endpoint para buscar os valores do campo "unidades"
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Retorna as unidades para o cliente
        return res.status(200).json({ unidades: unidadesResponse.data.enums });
      } catch (err) {
        console.error(
          `Erro ao buscar unidades para o cliente ${subdomain}:`,
          err
        );
        return res.status(500).json({
          error: `Erro ao buscar unidades para o cliente ${subdomain}`,
        });
      }
    } catch (error) {
      console.error("Erro ao listar unidades:", error);
      return res.status(500).json({ error: "Erro ao listar unidades." });
    }
  },

  async listarUnidadesTintim(req, res) {
    try {
      const clientes = await db(
        "select tu.id, cl.nome as cliente, tu.nome as unidade , todas_unidades, unidade_formatada from tintim_unidades tu inner join clientes cl on tu.empresa_id  = cl.id "
      );

      const data = clientes.map((cliente) => {
        return { ...cliente };
      });

      res.status(201).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes." });
    }
  },
  async excluirCliente(req, res) {
    try {
      const { id } = req.params;
      const response = await db(
        "DELETE FROM clientes WHERE id = $1 RETURNING *",
        [id]
      );
      if (response.length === 0) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      res.status(200).json({ message: "Cliente excluído com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes." });
    }
  },

  async excluirClientePipeline(req, res) {
    try {
      const { id } = req.params;
      const response = await db(
        "DELETE FROM cliente_pipelines WHERE id = $1 RETURNING *",
        [id]
      );
      if (response.length === 0) {
        return res.status(404).json({ error: "Pipeline não encontrado." });
      }

      res.status(200).json({ message: "Pipeline excluído com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao excluir Pipeline." });
    }
  },

  async cadastrarUnidadeTintim(req, res) {
    const { empresa_id, nome, todas_unidades } = req.body;

    try {
      const query = `
      INSERT INTO tintim_unidades (empresa_id, nome, todas_unidades, unidade_formatada)
      VALUES (
        $1, 
        CASE 
          WHEN $2 = TRUE THEN (SELECT nome FROM clientes WHERE id = $1) 
          ELSE $3 
        END, 
        $2,
        CASE 
          WHEN $2 = TRUE THEN LOWER(REGEXP_REPLACE((SELECT nome FROM clientes WHERE id = $1), '\\s+', '_', 'g'))
          ELSE LOWER(REGEXP_REPLACE($3, '\\s+', '_', 'g'))
        END
      )
      ON CONFLICT (empresa_id, nome) DO NOTHING
      RETURNING *;
    `;

      const values = [empresa_id, todas_unidades, nome];

      const data = await db(query, values);

      if (data.length === 0) {
        return res
          .status(409)
          .json({ message: "Unidade já cadastrada", success: false });
      }

      return res.status(201).json({
        message: "Unidade cadastrada com sucesso",
        success: true,
        unidade: data,
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
