import { db, descriptografarToken } from "../config/database.js";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import axios from "axios";
import { atualizarRotasPortais } from "../routes/portaisRoutes.js";
import { atualizarRotasTintim } from "../routes/tintimWebhookRoutes.js";

dotenv.config();

const ClienteController = {
  async cadastrarCliente(req, res) {
    try {
      const { nome, token, automotivo } = req.body;
      const secretKey = process.env.SECRET_KEY;

      // Verifica se o cliente já existe
      const clientes = await db("SELECT * FROM clientes WHERE nome = $1", [
        nome,
      ]);
      if (clientes.length > 0) {
        return res.status(400).json({ error: "Cliente já cadastrado." });
      }
      const encryptedToken = CryptoJS.AES.encrypt(token, secretKey).toString();
      // Insere o cliente no banco de dados
      const [result] = await db(
        "INSERT INTO clientes (nome, token, automotivo) VALUES ($1, $2, $3) RETURNING *",
        [nome, encryptedToken, automotivo]
      );

      res.status(201).json({ id: result.insertId, nome });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao cadastrar cliente." });
    }
  },

  async editarCliente(req, res) {
    try {
      const { nome, token, automotivo } = req.body;
      const { id } = req.params;

      const secretKey = process.env.SECRET_KEY;
      const encryptedToken = CryptoJS.AES.encrypt(token, secretKey).toString();

      const [result] = await db(
        ` UPDATE clientes
    SET nome = $1, token = $2, automotivo = $3
    WHERE id = $4`,
        [nome, encryptedToken, automotivo, id]
      );

      res.status(201).json({ id: result.insertId, nome });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao editar cliente." });
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
            status: pipeline._embedded.statuses.map((status) => {
              return {
                id: status.id,
                nome: status.name,
                is_editable: status.is_editable,
                type: status.type,
              };
            }),
          };
        }
      );

      res.status(201).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar pipelines" });
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

  async cadastrarClientePortais(req, res) {
    try {
      const { cliente_id, pipeline_id, status_id, nome, type } = req.body;
      console.log("Dados recebidos:", {
        cliente_id,
        pipeline_id,
        status_id,
        nome,
        type,
      });

      if (!cliente_id || !pipeline_id || !status_id || !nome) {
        return res.status(400).json({ error: "Dados inválidos." });
      }

      // Verificar se o cliente já está cadastrada com os  portais
      const existingPortal = await db(
        "SELECT 1 FROM clientes_portais WHERE empresa_id = $1",
        [cliente_id]
      );

      if (existingPortal.length > 0) {
        return res.status(200).json({
          success: false,
          message: "Esse cliente já está cadastrado.",
        });
      }

      // Inserir a nova portal
      await db(
        `
      INSERT INTO clientes_portais (empresa_id, nome, pipeline, status_pipeline, type)
      VALUES ($1, $2, $3, $4, $5)
       `,
        [cliente_id, nome, pipeline_id, status_id, type]
      );

      await atualizarRotasPortais();
      res
        .status(201)
        .json({ success: true, message: "Portal cadastrada com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao cadastrar portal." });
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
      res.status(500).json({ error: "Erro ao listar clientes tintim." });
    }
  },

  async listarMonitoramentoTintim(req, res) {
    const { id } = req.params;
    let query = `
SELECT 
    mo.nome_campanha, 
    mo.nome_conjunto,
    mo.nome_anuncio, 
    mo.telefone, 
    mo.id_lead, 
    mo.nome_lead, 
    mo.integrado, 
    mo.causa, 
    mo.data_criacao,
    mo.midia,
    mo.source,
    c.nome as nome_empresa
FROM 
    monitoramento_tintim mo
INNER JOIN 
    tintim_unidades tu ON mo.empresa_id = tu.empresa_id
INNER JOIN 
    clientes c ON mo.empresa_id = c.id
ORDER BY 
    mo.data_criacao DESC;
    `;

    const params = [];

    try {
      const monitoradosTintim = await db(query, params);

      const data = monitoradosTintim.map((tintim) => {
        return { ...tintim };
      });

      res.status(201).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes tintim." });
    }
  },
  async listarPortais(req, res) {
    try {
      const clientes = await db(
        " select cp.id, c.id as id_cliente , cp.nome , cp.pipeline, cp.status_pipeline , c.token from clientes_portais cp inner join clientes c on c.id = cp.empresa_id "
      );

      const result = clientes.map((cliente) => {
        return {
          id: cliente.id,
          id_cliente: cliente.id_cliente,
          nome: cliente.nome,
          token: descriptografarToken(cliente.token),
          pipeline_id: cliente.pipeline,
          status_id: cliente.status_pipeline,
        };
      });

      const data = await Promise.all(
        result.map(async (cliente) => {
          try {
            const response = await axios.get(
              `https://${cliente.nome}.kommo.com/api/v4/leads/pipelines`,
              {
                headers: {
                  Authorization: `Bearer ${cliente.token}`,
                },
              }
            );

            if (response.data._embedded && response.data._embedded.pipelines) {
              const pipeline = response.data._embedded.pipelines.find(
                (pipeline) => pipeline.id === cliente.pipeline_id
              );
              const pipeline_name = pipeline.name;
              const status_pipeline_name = pipeline._embedded.statuses.find(
                (status) => status.id === cliente.status_id
              ).name;

              const data_2 = {
                ...cliente,
                token: undefined,
                pipeline: pipeline_name,
                status_pipeline: status_pipeline_name,
                pipeline_id: cliente.pipeline_id,
                status_id: cliente.status_id,
              };

              return data_2;
            } else {
              return { ...cliente };
            }
          } catch (error) {
            console.error(
              `Erro ao buscar pipelines para o cliente ${cliente.nome}:`,
              error
            );
            return { ...cliente };
          }
        })
      );

      res.status(201).json({ data });
    } catch (error) {
      if (axios.isCancel(error)) {
        console.error("❌ Requisição cancelada:", error.message);
      } else if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao buscar lead pelo id:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao buscar lead pelo id:",
          error.response?.data || error
        );
      }
      res.status(500).json({ error: "Erro ao listar clientes portais." });
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
  async excluirClientePortais(req, res) {
    try {
      const { id } = req.params;
      const response = await db(
        "DELETE FROM clientes_portais WHERE id = $1 RETURNING *",
        [id]
      );
      if (response.length === 0) {
        return res.status(404).json({ error: "Portal não encontrado." });
      }

      res.status(200).json({ message: "Portal excluído com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao excluir Portal." });
    }
  },
  async excluirClienteTintim(req, res) {
    try {
      const { id } = req.params;
      const response = await db(
        "DELETE FROM tintim_unidades  WHERE id = $1 RETURNING *",
        [id]
      );
      if (response.length === 0) {
        return res.status(404).json({ error: "Tintim não encontrado." });
      }

      res.status(200).json({ message: "Tintim excluído com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao excluir tintim." });
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
  async editarTintim(req, res) {
    const { nome, todas_unidades } = req.body;
    const { id } = req.params;
    console.log("ID:", id);
    console.log("Nome:", nome);
    console.log("Todas Unidades:", todas_unidades);
    try {
      const query = `
  UPDATE tintim_unidades
  SET unidade_formatada = $1, 
      todas_unidades = $2
      WHERE id = $3;
`;

      const values = [nome, todas_unidades, id];
      const data = await db(query, values);
      if (!data) {
        return res.status(404).json({
          message: "Tintim não encontrado",
          success: false,
        });
      }

      await atualizarRotasTintim();
      return res.status(201).json({
        message: "Tintim editado com sucesso",
        success: true,
      });
    } catch (err) {
      console.error("Erro ao editar Tintim:", err);
      return res.status(500).json({
        message: "Erro no servidor",
        success: false,
        error: err.message,
      });
    }
  },
  async editarPortais(req, res) {
    const { pipeline, status_pipeline, status_type } = req.body;
    const { id } = req.params;
    try {
      const query = `
  UPDATE clientes_portais
  SET pipeline = $1, 
      status_pipeline = $2,
      type = $3
      WHERE id = $4;
`;

      const values = [pipeline, status_pipeline, status_type, id];
      const data = await db(query, values);
      if (!data) {
        return res.status(404).json({
          message: "Portal não encontrado",
          success: false,
        });
      }

      await atualizarRotasPortais();
      return res.status(201).json({
        message: "Portal editado com sucesso",
        success: true,
      });
    } catch (err) {
      console.error("Erro ao editar Portal:", err);
      return res.status(500).json({
        message: "Erro no servidor",
        success: false,
        error: err.message,
      });
    }
  },
};

export default ClienteController;
