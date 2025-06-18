import { Request, Response } from "express";
import { KommoModel } from "../models/kommo.models.js";
import { CustomFileds, funils } from "./jsons/index.js";
import axios from "axios";
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
}
