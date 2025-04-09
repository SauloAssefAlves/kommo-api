import { Request, Response } from "express";
import { KommoModel } from "../models/kommo.models.js";
import { incrementarContadorUnidade } from "../config/database.js";

export class TintimWebhookController {
  public clienteModel: KommoModel;

  constructor(clienteModel: KommoModel) {
    this.clienteModel = clienteModel;
  }

  private async buscarLeadComTentativas(telefone: string): Promise<any> {
    const delays = [1000, 5000, 10000]; // 1s, 5s, 10s
    let formattedPhone = telefone
    
      .replace(/^55/, "")
      .replace(/^(\d{2})9?(\d{8})$/, (_, ddd, numero) => {
        return parseInt(ddd) >= 31 ? `${ddd}${numero}` : `${ddd}9${numero}`;
      });

    for (let i = 0; i < delays.length; i++) {
      let lead = await this.clienteModel.buscarLeadPorTelefone(formattedPhone);

      if (lead) {
        return lead;
      }

      // Se for a última tentativa, faz a inversão do 9
      if (i === delays.length - 1) {
        formattedPhone = formattedPhone.replace(
          /^(\d{2})(9?)(\d{8})$/,
          (_, ddd, temNove, numero) => {
            return temNove ? `${ddd}${numero}` : `${ddd}9${numero}`;
          }
        );

        console.log(
          `📞 Última tentativa com telefone modificado: ${formattedPhone}`
        );

        lead = await this.clienteModel.buscarLeadPorTelefone(formattedPhone);
        if (lead) {
          return lead;
        }
      }

      if (i < delays.length - 1) {
        console.log(
          `🕒 Tentativa ${i + 1} de ${delays.length} - Aguardando ${
            delays[i]
          }ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delays[i]));
      }
    }
    return null;
  }

  public async atualizarFiledsWebhookTintim(req: Request, res: Response, cliente: any) {
    const webhookData = req.body;
    console.log("Webhook recebido:", webhookData);
    const contador = cliente.contador;
    if (webhookData.source != "Meta Ads") {
      console.log("❌ Webhook não rastreável");
      return res
        .status(200)
        .json({ message: "Webhook ignorado, mas recebido." });
    }
    const evoUser = await this.clienteModel.buscarUsuarioPorNome("EVO Result");
    const telefone = webhookData?.phone;

    const source = webhookData?.source;
    const { campaign_name, adset_name, ad_name } = webhookData?.ad || {};

    const campaing_name_tratado = campaign_name
      ? campaign_name.replace(/🅔🅥🅞|\bEVO\b/g, "").trim()
      : "";

    const lead = await this.buscarLeadComTentativas(telefone);

    if (!lead) {
      console.log("⚠️ Lead não encontrado para o webhook recebido.");
      return res
        .status(200)
        .json({ message: "Webhook recebido, mas lead não encontrado." });
    }

    // Alternando entre "Facebook ADS" e "Instagram"
    const midia = contador % 2 === 0 ? "Facebook ADS" : "Instagram ADS";
    await incrementarContadorUnidade(cliente.id);

    const camposNames = [
      { nomeCampo: "Origem", enumNome: "WhatsApp" },
      { nomeCampo: "Midia", enumNome: midia }, // Aqui alteramos a midia
      {
        nomeCampo: "Campanha (1° Impacto)", // campaing_name
      },
      {
        nomeCampo: "Conjunto de anúncio (1° Impacto)", // adset_name
      },
      {
        nomeCampo: "Anúncio (1° Impacto)", // ad_name
      },
      {
        nomeCampo: "Data da primeira conversão", // new Date()
      },
      {
        nomeCampo: "Lead veio de ADS",
        enumNome: "Sim", // sim
      },
      {
        nomeCampo: "Tipo Lead",
        enumNome: "Inbound", // Inbound
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
          if (webhookData.ad) {
            if (campo.nome === "Campanha (1° Impacto)") {
              fieldValue = { value: campaing_name_tratado };
            } else if (campo.nome === "Conjunto de anúncio (1° Impacto)") {
              fieldValue = { value: adset_name };
            } else if (campo.nome === "Anúncio (1° Impacto)") {
              fieldValue = { value: ad_name };
            }
          }
        }

        return {
          field_id: campo.id, // ID do campo no Kommo
          values: [fieldValue], // Sempre precisa estar dentro de um array
        };
      }),
    };

    const textTask = `LEAD FEZ UMA NOVA CONVERSÃO DE ADS
                  Campanha: ${campaing_name_tratado}
                  Conjunto: ${adset_name ? adset_name : ""}
                  Anúncio: ${ad_name ? ad_name : ""}`;
    const textNote = `- LEAD FEZ UMA NOVA CONVERSÃO DE ADS - Campanha: ${campaing_name_tratado} Conjunto: ${
      adset_name ? adset_name : ""
    } Anúncio: ${ad_name ? ad_name : ""}`;
    try {
      // Atualizando campos do lead
      await Promise.all([
        this.clienteModel.api.patch(`/leads/${lead.id}`, body),
        this.clienteModel.adicionarTask({
          text: "Lead de ads",
          leadId: lead.id,
          responsible_user_id: evoUser.id,
          result_text: textTask,
        }),
        this.clienteModel.adicionarNota({
          leadId: lead.id,
          text: textNote,
        }),
      ]);
      console.log("LEAD ATUALIZADO COM SUCESSO", lead.id, lead.name);
      return res
        .status(200)
        .json({ message: "✅ Webhook recebido com sucesso!!!!" });
    } catch (error) {
      console.error("❌ Erro ao atualizar lead:", error);
    }

    // console.log("📤 Resposta do Kommo:", response);
  }
}
