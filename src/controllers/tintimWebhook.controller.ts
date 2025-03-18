import { Request, Response } from "express";
import { ClienteModel } from "../models/cliente.models";
export class TintimWebhookController {
  public clienteModel: ClienteModel;
  constructor(clienteModel: ClienteModel) {
    this.clienteModel = clienteModel;
  }

  private async buscarLeadComTentativas(telefone: string): Promise<any> {
    // Delays em milissegundos para cada tentativa
    const delays = [300, 5000, 10000]; // 300ms para a primeira tentativa, e 2000ms para as 2 tentativas seguintes.

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
    const evoUser = await this.clienteModel.buscarUsuarioPorNome("EVO Result");
    const telefone = webhookData?.lead.phone;

    const { source } = webhookData?.lead;

    const {
      campaing_name = "sem informação",
      adset_name = "sem informação",
      ad_name = "sem informação",
    } = webhookData?.lead?.ad || {};

    const lead = await this.buscarLeadComTentativas(telefone);

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
    console.log("🔍 Campos personalizados:", evoUser.id);
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
    } catch (error) {
      console.error("❌ Erro ao buscar IDs dos campos:", error);
      return [];
    }

    // console.log("📤 Resposta do Kommo:", response);
  }
}
