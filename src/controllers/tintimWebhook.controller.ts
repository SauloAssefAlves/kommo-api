import { Request, Response } from "express";
import { ClienteModel } from "../models/cliente.models.js";
export class TintimWebhookController {
  public clienteModel: ClienteModel;
  constructor(clienteModel: ClienteModel) {
    this.clienteModel = clienteModel;
  }

  private async buscarLeadComTentativas(telefone: string): Promise<any> {
    // Delays em milissegundos para cada tentativa
    const delays = [1000, 5000, 10000]; // 1s, 5s, 10s

    for (let i = 0; i < delays.length; i++) {
      const lead = await this.clienteModel.buscarLeadPorTelefone(telefone);

      if (lead) {
        return lead; // Se encontrar o lead, retorna.
      }

      // Se não encontrou e não é a última tentativa, aguarda o delay.
      if (i < delays.length - 1) {
        console.log(
          `🕒 Tentativa ${i + 1} de ${delays.length} - Aguardando ${
            delays[i]
          }ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delays[i])); // Delay em milissegundos
      }
    }

    return null; // Se não encontrar nada após as tentativas, retorna null
  }

  public async atualizarFiledsWebhookTintim(req: Request, res: Response) {
    const webhookData = req.body;
    console.log("DATA:", webhookData);
    const evoUser = await this.clienteModel.buscarUsuarioPorNome("EVO Result");
    console.log(evoUser);
    const telefone = webhookData?.phone;

    const source = webhookData?.source;

    const { campaing_name, adset_name, ad_name } = webhookData?.ad || {};

    const lead = await this.buscarLeadComTentativas(telefone);

    // Se não encontrar o lead, retorna erro
    if (!lead) {
      return res.status(404).json({ error: "Lead não encontrado" });
    }

    const camposNames = [
      { nomeCampo: "Origem", enumNome: "WhatsApp" /* source */ },
      { nomeCampo: "Midia", enumNome: "Facebook ADS" },
      {
        nomeCampo: "Campanha (1° Impacto)" /* campaing_name */,
      },
      {
        nomeCampo: "Conjunto de anúncio (1° Impacto)" /* adset_name */,
      },
      {
        nomeCampo: "Anúncio (1° Impacto)" /* ad_name */,
      },
      {
        nomeCampo: "Data da primeira conversão" /* new Date() */,
      },
      {
        nomeCampo: "Lead veio de ADS",
        enumNome: "Sim" /* sim */,
      },
      {
        nomeCampo: "Tipo Lead",
        enumNome: "Inbound" /* Inbound */,
      },
    ];
    const camposPersonalizados =
      await this.clienteModel.buscarIdsPorNomesCampos(camposNames);
    const body = {
      custom_fields_values: camposPersonalizados.map((campo) => {
        let fieldValue: any;

        if (campo.type === "select") {
          // Se for um campo SELECT, usa enumId e adiciona enum_code como null
          fieldValue = {
            value: campo.enumNome,
            enum_id: campo.enumId,
            enum_code: null,
          };
        } else if (campo.type === "date_time") {
          // Se for um campo DATE_TIME, transforma em timestamp
          fieldValue = { value: Math.floor(Date.now() / 1000) }; // Timestamp em segundos
        } else {
          if (campo.nome === "Campanha (1° Impacto)") {
            fieldValue = { value: campaing_name || "Sem nome" };
          } else if (campo.nome === "Conjunto de anúncio (1° Impacto)") {
            fieldValue = { value: adset_name || "Sem nome" };
          } else if (campo.nome === "Anúncio (1° Impacto)") {
            fieldValue = { value: ad_name || "Sem nome" };
          }
        }

        return {
          field_id: campo.id, // ID do campo no Kommo
          values: [fieldValue], // Sempre precisa estar dentro de um array
        };
      }),
    };

    const textTask = `LEAD FEZ UMA NOVA CONVERSÃO DE ADS
                  Campanha: ${campaing_name}
                  Conjunto: ${adset_name}
                  Anúncio: ${ad_name}`;
    const textNote = `- LEAD FEZ UMA NOVA CONVERSÃO DE ADS - Campanha: ${campaing_name} Conjunto: ${adset_name} Anúncio: ${ad_name}`;
    try {
      // atualizando campos do lead
      await this.clienteModel.api.patch(`/leads/${lead.id}`, body);
      console.log("LEAD ATUALIZADO COM SUCESSO", lead.id, lead.name);
      //criando task
      await this.clienteModel.adicionarTask({
        text: "Lead de ads",
        leadId: lead.id,
        responsible_user_id: evoUser.id,
        result_text: textTask,
      });
      //criando note
      await this.clienteModel.adicionarNota({
        leadId: lead.id,
        text: textNote,
      });
      return res.status(200).json({ message: "Lead atualizado com sucesso" });
    } catch (error) {
      console.error("❌ Erro ao atualizar lead:", error);
      return res.status(500).json({ error: "Erro ao atualizar lead" });
    }

    // console.log("📤 Resposta do Kommo:", response);
  }
}
