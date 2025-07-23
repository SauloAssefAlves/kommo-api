import e, { Request, Response } from "express";
import { KommoModel } from "../models/kommo.models.js";
import { CustomFileds, funils } from "./jsons/index.js";
import axios from "axios";
import { loginSws } from "../sws_utils/loginSws.js";
import { searchCpf } from "../sws_utils/searchCpf.js";
import { getTipoAdesaoPorNome } from "../sws_utils/adesaoName.js";
export class KommoController {
  public clienteModel: KommoModel;
  private status: any;

  async apagarTodosOsCustomFields(subdomain: string, token: string) {
    console.log(
      "--- INICIANDO PROCESSO DE EXCLUSÃO DE CAMPOS PERSONALIZADOS ---"
    );

    const DELAY_ENTRE_REQUISICOES = 500; // ms

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    try {
      // 1. Buscar todos os campos personalizados existentes
      console.log("Buscando a lista de todos os campos personalizados...");
      const responseGet = await axios.get(
        `https://${subdomain}.kommo.com/api/v4/leads/custom_fields`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const customFields = responseGet.data?._embedded?.custom_fields || [];

      if (customFields.length === 0) {
        console.log("Nenhum campo personalizado para apagar.");
        return;
      }

      // 2. Filtrar para remover campos que não podem ser apagados
      const camposParaApagar = customFields.filter(
        (field: any) => field.is_deletable === true
      );

      if (camposParaApagar.length === 0) {
        console.log("Nenhum campo customizado deletável foi encontrado.");
        return;
      }

      console.log(
        `\nEncontrados ${camposParaApagar.length} campos deletáveis. Iniciando exclusão...`
      );

      // 3. Iterar sobre a lista e apagar cada campo um por um
      let sucessos = 0;
      let falhas = 0;

      for (const [index, field] of camposParaApagar.entries()) {
        console.log(
          `[${index + 1}/${
            camposParaApagar.length
          }] Tentando apagar o campo: "${field.name}" (ID: ${field.id})...`
        );
        try {
          await axios.delete(
            `https://${subdomain}.kommo.com/api/v4/leads/custom_fields/${field.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log(`   ✅ Sucesso!`);
          sucessos++;
        } catch (error) {
          console.log(`   ❌ Falha!`);
          falhas++;
        }
        // Adiciona a pausa para não exceder o limite da API
        await sleep(DELAY_ENTRE_REQUISICOES);
      }

      // 4. Exibir o resumo final
      console.log("\n--- PROCESSO DE EXCLUSÃO CONCLUÍDO ---");
      console.log(
        `Total de campos deletáveis encontrados: ${camposParaApagar.length}`
      );
      console.log(`Sucessos: ${sucessos}`);
      console.log(`Falhas: ${falhas}`);
    } catch (error) {
      // Erro na busca inicial de campos
      console.error(
        "\nOcorreu um erro crítico ao buscar a lista de campos. O processo foi interrompido."
      );
    }
  }
  private async encontrarIdsPorNomes(
    nomesPipeline: string[],
    nomesStatus: string[]
  ) {
    // Busca todos os pipelines
    const pipelines = await this.clienteModel.getPipelines();
    const resultados: { pipeline_id: any; status_id: any }[] = [];

    for (const nomePipeline of nomesPipeline) {
      const pipeline = pipelines.find(
        (p: any) => p.name.toLowerCase() === nomePipeline.toLowerCase()
      );

      if (!pipeline) {
        console.warn(
          `Aviso: Pipeline com nome "${nomePipeline}" não encontrado.`
        );
        continue;
      }

      const statuses = pipeline._embedded.statuses;
      for (const nomeStatus of nomesStatus) {
        const status = statuses.find(
          (s: any) => s.name.toLowerCase() === nomeStatus.toLowerCase()
        );

        if (!status) {
          console.warn(
            `Aviso: Status com nome "${nomeStatus}" não encontrado no pipeline "${nomePipeline}".`
          );
          continue;
        }

        resultados.push({
          pipeline_id: pipeline.id,
          status_id: status.id,
        });
      }
    }

    console.log(resultados);
    return resultados;
  }

  destroy(): void {
    // Libera recursos associados ao KommoModel desta instância
    if (this.clienteModel) {
      this.clienteModel.destroy();
      this.clienteModel = null as any;
    }
  }

  public async cadastrarCustomFields(
    subdomain: string,
    token: string
  ): Promise<any> {
    try {
      // this.apagarTodosOsCustomFields(subdomain, token);
      this.clienteModel = KommoModel.getInstance(subdomain, token);
      const grupos = await this.clienteModel.listarGrupos();
      // Passe o clienteModel ou a função encontrarIdsPorNomes como parâmetro para CustomFileds
      const customFieldsHelper = async (
        nomesPipeline: string[],
        nomesStatus: string[]
      ) => {
        // Garante acesso ao clienteModel da instância
        return await this.encontrarIdsPorNomes(nomesPipeline, nomesStatus);
      };
      const nomesProcurados = [
        "Marketing",
        "SDR",
        "Veículo",
        "Visita loja",
        "Test-drive",
        "Usado",
        "Venda",
        "API",
      ];
      const gruposFiltrados = grupos.filter((grupo: any) =>
        nomesProcurados.includes(grupo.name)
      );
      const nomesFaltando = nomesProcurados.filter(
        (nome) => !gruposFiltrados.some((grupo: any) => grupo.name === nome)
      );

      if (nomesFaltando.length > 0) {
        this.destroy();
        return {
          success: false,
          message: `Os seguintes grupos não foram encontrados: ${nomesFaltando.join(
            ", "
          )}`,
        };
      }

      const idsGrupos = gruposFiltrados.reduce((acc: any, grupo: any) => {
        acc[grupo.name] = grupo.id;
        return acc;
      }, {});

      const body = await CustomFileds(idsGrupos, customFieldsHelper);
      // return body;
      await axios.post(
        `https://${subdomain}.kommo.com/api/v4/leads/custom_fields`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      this.destroy();
      return body;
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
    }
  }
  public async cadastrarPipelines(subdomain: string, token: string) {
    try {
      const pipelines = funils;
      this.clienteModel = KommoModel.getInstance(subdomain, token);
      let statusInfo = { cliente: subdomain, status: [] };
      for (const pipeline of pipelines) {
        console.log("Cadastrando pipeline:", pipeline.name);
        const body = [
          {
            name: pipeline.name,
            sort: pipeline.sort,
            is_main: pipeline.is_main,
            is_unsorted_on: pipeline.is_unsorted_on,
            _embedded: {
              statuses: [
                { id: 142, name: pipeline.etapa_sucesso },
                { id: 143, name: pipeline.etapa_insucesso },
              ],
            },
          },
        ];
        const response = await this.clienteModel.cadastrarPipeline(body);
        console.log("Pipeline cadastrado:", response._embedded.pipelines[0]);
        const idPipeline = response._embedded.pipelines[0].id;
        const bodyStatus = pipeline.status.map((status: any) => ({
          name: status.name,
          sort: status.sort,
          color: status.color,
        }));
        console.log("Cadastrando status para o pipeline:", bodyStatus);
        const responseStatus = await this.clienteModel.cadastrarStatus(
          bodyStatus,
          idPipeline
        );
        statusInfo.status.push({
          pipeline: response._embedded.pipelines[0].name,
          status: responseStatus._embedded.statuses.map((status: any) => ({
            name: status.name,
            id: status.id,
          })),
        });
      }

      console.dir(statusInfo, { depth: null });
      this.status = statusInfo;
      this.destroy();
    } catch (error) {
      console.error("Erro ao cadastrar pipelines e status: ", error);
      throw error;
    }
  }

  public async updateCustomFields(
    params:
      | {
          subdomain: string;
          token: string;
          lead_id: number;
          customFieldsToUpdate: { name: string; value?: any }[];
        }
      | {
          clienteModel: KommoModel;
          lead_id: number;
          customFieldsToUpdate: { name: string; value?: any }[];
        }
  ): Promise<{ success: boolean; mensagem?: any }> {
    let clienteModel: KommoModel | null = null;
    try {
      let customFieldsToUpdate: { name: string; value?: any }[];
      if ("clienteModel" in params) {
        clienteModel = params.clienteModel;
        customFieldsToUpdate = params.customFieldsToUpdate;
      } else {
        clienteModel = KommoModel.getInstance(params.subdomain, params.token);
        customFieldsToUpdate = params.customFieldsToUpdate;
      }

      const customFieldsResponse = await clienteModel.getCustomfields({
        entity_type: "leads",
      });
      const customFields = customFieldsResponse?._embedded?.custom_fields || [];

      const camposEncontrados = customFields.filter((field: any) =>
        customFieldsToUpdate.some((cf) => cf.name === field.name)
      );

      // Verifica se todos os campos foram encontrados
      const nomesCamposEncontrados = camposEncontrados.map(
        (field: any) => field.name
      );
      const nomesCamposSolicitados = customFieldsToUpdate.map((cf) => cf.name);
      const camposNaoEncontrados = nomesCamposSolicitados.filter(
        (nome) => !nomesCamposEncontrados.includes(nome)
      );

      if (camposNaoEncontrados.length > 0) {
        return {
          success: false,
          mensagem: `Campos não encontrados: ${camposNaoEncontrados.join(
            ", "
          )}`,
        };
      }

      const camposComIdEValor = camposEncontrados.map((field: any) => {
        const campo = customFieldsToUpdate.find((cf) => cf.name === field.name);
        return {
          field_id: field.id,
          values: [{ value: campo?.value }],
        };
      });
      console.log("Campos encontrados e formatados para atualização:");
      console.dir(camposComIdEValor, { depth: null });

      let subdomainKommo: string;
      let tokenKommo: string;
      if ("clienteModel" in params) {
        subdomainKommo = clienteModel.subdomain;
        tokenKommo = clienteModel.token;
      } else {
        subdomainKommo = params.subdomain;
        tokenKommo = params.token;
      }

      const response = await axios.patch(
        `https://${subdomainKommo}.kommo.com/api/v4/leads/${params.lead_id}`,

        JSON.stringify({
          custom_fields_values: camposComIdEValor,
        }),

        {
          headers: {
            Authorization: `Bearer ${tokenKommo}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.dir(response.data);

      return { success: true, mensagem: response.data };
    } catch (error) {
      if (axios.isCancel(error)) {
        console.error("❌ Requisição cancelada:", error.message);
      } else if (error.response?.data?.["validation-errors"]) {
        console.error("❌ Requisição cancelada:");
        return {
          success: false,
          mensagem: error.response?.data["validation-errors"][0].errors,
        };
      }
    } finally {
      if (clienteModel) {
        clienteModel.destroy();
      } else {
        this.destroy();
      }
    }
  }

  public async buscarCpfSws(
    kommoCliente: { subdomain: string; tokenDescriptografado: string },
    lead_id: number
  ): Promise<any> {
    const { subdomain, tokenDescriptografado } = kommoCliente;
    this.clienteModel = KommoModel.getInstance(
      subdomain,
      tokenDescriptografado
    );
    const lead = await this.clienteModel.buscarLeadPorId(lead_id);
    if (!lead) {
      console.error("Lead não encontrado com o ID:", lead_id);
      this.destroy();
      return { success: false, mensagem: "Lead não encontrado." };
    }

    // Busca o valor do campo "API Consulta CPF"
    let cpfApiConsulta: string | undefined;
    if (lead && Array.isArray(lead.custom_fields_values)) {
      const cpfApiField = lead.custom_fields_values.find(
        (field: any) => field.field_name === "API Consulta CPF"
      );
      if (
        cpfApiField &&
        Array.isArray(cpfApiField.values) &&
        cpfApiField.values[0]?.value
      ) {
        cpfApiConsulta = cpfApiField.values[0].value;
        console.log(
          "CPF encontrado no campo API Consulta CPF:",
          cpfApiConsulta
        );
      }
    }
    function capitalizeFirstLetter(val) {
      return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }

    console.log("CPF API Consulta:", cpfApiConsulta);
    // Pega o id do contato principal (main)
    // let mainContactId: number | null = null;
    // if (lead && lead._embedded && Array.isArray(lead._embedded.contacts)) {
    //   const mainContact = lead._embedded.contacts.find((c: any) => c.is_main);
    //   if (mainContact) {
    //     mainContactId = mainContact.id;
    //   } else {
    //     console.log("Nenhum contato principal encontrado.");
    //   }
    // } else {
    //   console.log("Lead não possui contatos vinculados.");
    // }

    // const contato = await this.clienteModel.getContactById(
    //   mainContactId as number
    // );
    // Busca o CPF (vat_id) do contato nos campos customizados
    // let cpf: string | undefined;
    // if (contato && Array.isArray(contato.custom_fields_values)) {
    //   const cpfField = contato.custom_fields_values.find(
    //     (field: any) =>
    //       field.field_name === "CPF" && field.field_type === "legal_entity"
    //   );
    //   if (
    //     cpfField &&
    //     Array.isArray(cpfField.values) &&
    //     cpfField.values[0]?.value?.vat_id
    //   ) {
    //     cpf = cpfField.values[0].value.vat_id;
    //   }
    // }

    function toIso8601(dateStr) {
      if (!dateStr || dateStr === "N/A") return dateStr;
      // yyyy-mm-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split("-");
        // Cria a data na timezone local
        const date = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          0,
          0,
          0,
          0
        );
        return Math.floor(date.getTime() / 1000);
      }
      // dd/mm/yyyy
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split("/");
        const date = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          0,
          0,
          0,
          0
        );
        return Math.floor(date.getTime() / 1000);
      }
      // yyyy-mm-ddTHH:MM:SSZ
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(dateStr)) {
        const [datePart] = dateStr.split("T");
        const [year, month, day] = datePart.split("-");
        const date = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          0,
          0,
          0,
          0
        );
        return Math.floor(date.getTime() / 1000);
      }
      // Outros formatos
      let date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return Math.floor(date.getTime() / 1000);
    }

    try {
      const email = process.env.LOGIN_USERNAME_SWS;
      const password = process.env.LOGIN_PASSWORD_SWS;

      // Exemplo de uso das variáveis
      const { subdomain, tokenDescriptografado } = kommoCliente;
      this.clienteModel = KommoModel.getInstance(
        subdomain,
        tokenDescriptografado
      );
      const token = await loginSws(email, password);
      const infoCpf = await searchCpf(token, cpfApiConsulta as string);
      console.log("Informações do CPF:", infoCpf);
      if (infoCpf.success === false) {
        console.log("CPF não encontrado ou inválido:", infoCpf.mensagem);
        const nota = {
          leadId: lead_id,
          text: `CPF ${cpfApiConsulta} não encontrado ou inválido: ${infoCpf.mensagem}`,
        };
        await this.clienteModel.adicionarNota(nota);
        this.destroy();
        return infoCpf;
      }
      // Verifica se os campos necessários estão presentes
      const camposNecessarios = [
        { name: "Plano contratado", value: infoCpf.adesao.plano.nome },
        {
          name: "Status da adesão",
          value: getTipoAdesaoPorNome(infoCpf.adesao.status.nome),
        },
        {
          name: "Data inicio adesão",
          value: toIso8601(infoCpf.adesao.data_inicio),
        },
        {
          name: "Data final adesão",
          value: toIso8601(infoCpf.adesao.data_final),
        },
        {
          name: "ID Adesão",
          value: infoCpf.adesao.id?.toString() || "N/A",
        },
        {
          name: "Situação para check-in",
          value: capitalizeFirstLetter(infoCpf.situacao_checkin),
        },

        //Vencimento próxima parcela
        //Valor da próxima parcela
        //Situação para check-in
      ];
      if (infoCpf.parcelas && infoCpf.parcelas.length > 0) {
        camposNecessarios.push(
          {
            name: "Vencimento próxima parcela",
            value: toIso8601(infoCpf.parcelas[0].vencimento),
          },
          {
            name: "Valor da próxima parcela",
            value: `R$ ${String(infoCpf.parcelas[0].valor)}` || "N/A",
          }
        );
      }

      // Função para formatar data no padrão brasileiro (dd/mm/yyyy)
      function formatDateBr(dateStr: string) {
        if (!dateStr || dateStr === "N/A") return "N/A";
        let date: Date;
        // yyyy-mm-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split("-");
          date = new Date(Number(year), Number(month) - 1, Number(day));
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          return dateStr;
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(dateStr)) {
          date = new Date(dateStr);
        } else {
          date = new Date(dateStr);
        }
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString("pt-BR");
      }

      const nota = {
        leadId: lead_id,
        text:
          "Consulta de CPF realizada:\n" +
          "--------------------------------\n" +
          "CPF: " +
          (cpfApiConsulta || "N/A") +
          "\n" +
          "Nome: " +
          capitalizeFirstLetter(
            infoCpf.nome || infoCpf.adesao.plano.nome || "N/A"
          ) +
          "\n" +
          "Situação: " +
          capitalizeFirstLetter(
            (infoCpf.adesao?.status?.nome && infoCpf.adesao?.status?.nome) ||
              "N/A"
          ) +
          "\n" +
          "Plano: " +
          capitalizeFirstLetter(infoCpf.adesao?.plano?.nome || "N/A") +
          "\n" +
          "Data de início: " +
          formatDateBr(infoCpf.adesao?.data_inicio) +
          "\n" +
          "Data final: " +
          formatDateBr(infoCpf.adesao?.data_final) +
          "\n" +
          "--------------------------------",
        typeNote: "extended_service_message",
      };
      await this.clienteModel.adicionarNota(nota);
      const responseCustomFields = await this.updateCustomFields({
        clienteModel: this.clienteModel,
        customFieldsToUpdate: camposNecessarios,
        lead_id,
      });

      if (responseCustomFields.success === false) {
        console.error(
          "Erro ao atualizar campos personalizados:",
          responseCustomFields
        );
        this.destroy();
        return responseCustomFields;
      }

      return responseCustomFields;
    } catch (error) {
      console.error("Erro ao buscar CPF SWS:", error);
      this.destroy();
      throw error;
    }
  }
}
