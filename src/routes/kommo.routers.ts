import { Router, Request, Response } from "express";
import { KommoController } from "../controllers/kommo.controller.js";
import { authenticateToken } from "../auth/middleware.js";
import { db, descriptografarToken } from "../config/database.js";
import { mockData } from "../utils/mocks.js";
import { KommoModel } from "../models/kommo.models.js";
const router = Router();
const kommoController = new KommoController();

// ----------- LISTAGENS -----------

// ----------- CADASTROS -----------
router.post(
  "/cadastrarCustomFields/:id",
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const cliente = await db("select nome, token from clientes where id = $1", [
      id,
    ]);
    console.log("Cliente encontrado:", cliente);
    const tokenDescriptografado = descriptografarToken(cliente[0].token);
    const subdomain = cliente[0].nome;
    console.log("Token descriptografado:", tokenDescriptografado);
    const response = await kommoController.cadastrarCustomFields(
      subdomain as string,
      tokenDescriptografado as string
    );
    res.status(201).json({ data: response });
  }
);
router.post("/cadastrarPipelines/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  // const cliente = await db("select nome, token from clientes where id = $1", [
  //   id,
  // ]);
  // console.log("Cliente encontrado:", cliente);
  // const tokenDescriptografado = descriptografarToken(cliente[0].token);
  // const subdomain = cliente[0].nome;
  // console.log("Token descriptografado:", tokenDescriptografado);
  const subdomain = "routecar";
  const tokenDescriptografado =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImJlZTg4NDU3ZDE4ODlmZmU2NjQyZjk0Y2M5YjIyMjg1MjkyNTFhYTk2ODcyNzdhOGY5N2M0MmExNmI0YjkxYTIwYzQ2YTQ2YmY2NTQ0OWQ2In0.eyJhdWQiOiI0MTk1NzhkMy0zOTQ3LTRlN2YtYWNhNC1hNjI4YjQ1ZmRmZTUiLCJqdGkiOiJiZWU4ODQ1N2QxODg5ZmZlNjY0MmY5NGNjOWIyMjI4NTI5MjUxYWE5Njg3Mjc3YThmOTdjNDJhMTZiNGI5MWEyMGM0NmE0NmJmNjU0NDlkNiIsImlhdCI6MTc1NjIzMTcwNiwibmJmIjoxNzU2MjMxNzA2LCJleHAiOjE4MTI2NzIwMDAsInN1YiI6IjEwMjgxNTk5IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM1MDgwNDIwLCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwidXNlcl9mbGFncyI6MSwiaGFzaF91dWlkIjoiMDQ1NzU0MGItZjIxYS00YzU2LWI4NTAtODA2Yzk2MTViMGQ2IiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.f44Xzo_3WaB4gT9RS5YpLgDuBRyO28RRU3v7hOfgWoRciXbMAcImRQtBolYDGB2ImJz8G6MiYef9ARp4TZXkL6Ekwrdpjt7v9rBqqk3-2br4_q1LMX9DVQTK5xDfd-C5G8gTa7xGm13cLCckQiPnDOks_f62Ozg6D6N691akhmniSNvi3ubFGcLppzKop8Y95R1gxy1XpzWQ_HNOlTAjcOoRFYJykPTj-tTweYjrN5fusSLROQFmQ4O_hgKv57VFtxLrsElQq53ChOsKslhEnvYpe1tVBvo9aWA4qAFYoEoncWDUlQ4ywR1U3qvyQbrpJpN4Xk3li2dG695g_eGC7A";
  const response = await kommoController.cadastrarPipelines(
    subdomain as string,
    tokenDescriptografado as string
  );

  res.status(201).json({ data: response });
});

// ----------- FORTALEZA -----------

router.post("/buscarCpfSws/:lead_id", async (req: Request, res: Response) => {
  // Extrai o id do lead do formato de entrada esperado
  console.log("Buscando CPF no SWS para o lead:", req.params);

  const lead_id = req.params.lead_id;

  try {
    const cliente = await db("select nome, token from clientes where id = 28");
    console.log("Cliente encontrado para SWS:", cliente[0].nome);
    const tokenDescriptografado = descriptografarToken(cliente[0].token);
    const subdomain = cliente[0].nome;
    const kommoCliente = { subdomain, tokenDescriptografado };

    const response = await kommoController.buscarCpfSws(
      kommoCliente,
      Number(lead_id)
    );

    res.status(200).json({ data: response });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar CPF no SWS" });
  }
});

router.get(
  "/statusUserResp/:user_id/:account_id",
  async (req: Request, res: Response) => {
    // Extrai o id do lead do formato de entrada esperado

    const { user_id, account_id } = req.params;

    try {
      const status = await db(
        `select active from status_users_resp where user_resp_id = $1 and account_id = $2`,
        [user_id, account_id]
      );
      res.status(200).json({ data: { ...status[0] } });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erro ao verificar status do usuário responsável" });
    }
  }
);

router.post("/statusUserResp", async (req: Request, res: Response) => {
  // Extrai o id do lead do formato de entrada esperado

  const { user_id, account_id, group_id, status } = req.body;

  try {
    const existe_user = await db(
      `select * from status_users_resp where user_resp_id = $1 and account_id = $2 and group_id = $3`,
      [user_id, account_id, group_id]
    );
    if (existe_user.length > 0) {
      await db(
        `update status_users_resp set active = $1 where user_resp_id = $2 and account_id = $3 and group_id = $4`,
        [status, user_id, account_id, group_id]
      );
      if (status) {
        //temporario----
        const nome = "fortalezaec";
        // const nome = "evoresultdev";

        // Se o status for ativo, verificar se há leads na fila de espera para esse grupo e iniciar o Sales Bot
        console.log("Verificando leads na fila de espera...");
        const client = await db(
          "select nome, token from clientes where nome = $1",
          [nome]
        );
        const tokenDescriptografado = descriptografarToken(client[0].token);
        const subdomain = client[0].nome;
        const kommoCliente = { subdomain, tokenDescriptografado };
        // kommoController instance is already defined above, no need to reassign or use 'this'
        const clienteModel = KommoModel.getInstance(
          subdomain,
          tokenDescriptografado
        );

        const leads_waiting = await db(
          `select id_lead, salesbot_id from leads_waiting where group_user_resp_id = $1 and account_id = $2`,
          [group_id, account_id]
        );

        console.log("Leads na fila de espera:", leads_waiting);
        if (leads_waiting.length === 0) {
          console.log("Nenhum lead na fila de espera.");
          clienteModel.destroy();
          return;
        }
        for (const lead of leads_waiting) {
          const salesbot_id = lead.salesbot_id;
          const body = [
            {
              bot_id: Number(lead.salesbot_id),
              entity_id: Number(lead.id_lead),
              entity_type: "2",
            },
          ];
          console.log("Iniciando Sales Bot para o lead:", body);
          try {
            const responseSales = await clienteModel.runSalesBot(body);
            console.log("Resposta do Sales Bot:", responseSales);

            if (responseSales.success) {
              await db(`delete from leads_waiting where id_lead = $1`, [
                lead.id_lead,
              ]);
              console.log(
                `Lead ${lead.id_lead} removido da fila de espera após atribuição.`
              );
            }
          } catch (error) {
            console.error(
              `Erro ao iniciar Sales Bot para o lead ${lead.id_lead}:`,
              error
            );
          }
        }
        clienteModel.destroy();
      }
    } else {
      await db(
        `insert into status_users_resp (user_resp_id, account_id, group_id, active) values ($1, $2, $3, $4)`,
        [user_id, account_id, group_id, status]
      );
    }

    res.status(200).json({
      data:
        "Status do usuário responsável atualizado com sucesso para " + status,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao mudar o status do usuario responsavel" });
  }
});

router.post("/mudarUsuarioResp", async (req: Request, res: Response) => {
  // Extrai o id do lead do formato de entrada esperado
  console.log("Query params:", req.query);
  const { user_id, salesbot_id, group_id } = req.query;

  const last = req.query.last as string | undefined;

  if (Object.keys(req.query).length === 0) {
    res.status(400).json({ error: "Query parameters são obrigatórios" });
    return;
  }

  const lead_info: { id: string; status_id: string; pipeline_id: string } = {
    ...req.body.leads.add[0],
    user_id: user_id as string,
    salesbot_id: salesbot_id as string,
    group_id: group_id as string,
    last: last === "true",
  };
  const account_id = req.body.account.id;
  const subdomain_account = req.body.account.subdomain;
  console.log(account_id, subdomain_account, lead_info);

  try {
    const cliente = await db(
      "select nome, token from clientes where nome = $1",
      [subdomain_account]
    );
    const tokenDescriptografado = descriptografarToken(cliente[0].token);
    const subdomain = cliente[0].nome;
    const kommoCliente = { subdomain, tokenDescriptografado };

    const response = await kommoController.mudarUsuarioResp(
      kommoCliente,
      lead_info,
      account_id
    );

    res.status(200).json({ data: response });
  } catch (error) {
    res.status(500).json({ error: "Erro ao mudar usuario responsavel" });
  }
});

// ----------- Vox2You -----------

router.post("/cadastrarLeadVox2you", async (req: Request, res: Response) => {
  // Extrai o id do lead do formato de entrada esperado
  console.log("Cadastrando lead no Vox2You:", req.body);

  const { fields } = req.body;
  const subdomain = fields.subdomain.value;
  const contaId = fields.contaId.value;
  const funilId = fields.funilId.value;

  try {
    const cliente = await db(
      "select nome, token from clientes where nome = $1",
      [subdomain]
    );
    console.log("Cliente encontrado", cliente[0].nome);
    const tokenDescriptografado = descriptografarToken(cliente[0].token);
    const kommoCliente = { subdomain, tokenDescriptografado };
    let valido = false;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: "Bearer " + tokenDescriptografado,
      },
    };

    try {
      const response = await fetch(
        `https://${subdomain}.kommo.com/api/v4/account`,
        options
      );
      const res = await response.json();
      if (res.id === contaId) {
        valido = true;
      }
    } catch (err) {
      console.error("Erro ao validar o contaID:", err);
      res.status(500).json({ error: "Erro ao validar o contaID" });
      return;
    }
    if (valido) {
      const { fields } = req.body;

      // Mock data for testing - replace with actual req.body in production

      // Use mockData.fields instead of fields for testing
      const lead = {
        nome: fields.nome.value,
        telefone: fields.telefone.value,
        unidade: fields.unidade.value,
        cursodeinteresse: fields.cursodeinteresse.value,
        midia: fields.midia.value,
        origem: fields.origem.value,
        email: fields.email.value,
        profissao: fields.profissao.value,
        utm_content: fields.utm_content.value,
        utm_medium: fields.utm_medium.value,
        utm_campaign: fields.utm_campaign.value,
        utm_source: fields.utm_source.value,
        utm_term: fields.utm_term.value,
        utm_referrer: fields.utm_referrer.value,
        referrer: fields.referrer.value,
        gclientid: fields.gclientid.value,
        gclid: fields.gclid.value,
        fbclid: fields.fbclid.value,
      };
      const info = {
        ...Object.fromEntries(
          Object.entries(fields)
            .filter(
              ([key, field]: [string, any]) =>
                field.type !== "hidden" &&
                ![
                  "nome",
                  "telefone",
                  "cursodeinteresse",
                  "email",
                  "profissao",
                ].includes(key)
            )
            .map(([key, field]: [string, any]) => [key, field.value])
        ),
      };
      const response = await kommoController.cadastrarLeadVox2You(
        kommoCliente,
        lead,
        info,
        funilId
      );

      res.status(200).json({ data: response });
    } else {
      res.status(403).json({ error: "Conta ID inválido" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao cadastrar lead no Vox2You" });
  }
});
export default router;
