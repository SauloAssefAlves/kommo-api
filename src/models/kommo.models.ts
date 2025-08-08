import axios, { AxiosInstance } from "axios";
import { query } from "express";
import * as http from "http";
import * as https from "https";

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
}

export class KommoModel {
  private static instances: Map<string, KommoModel> = new Map();

  public constructor(public subdomain: string, public token: string) {}

  public api!: AxiosInstance;

  // Método estático para acessar a instância (Singleton por subdomain/token)
  public static getInstance(subdomain: string, token: string): KommoModel {
    const key = `${subdomain}:${token}`;

    const instance = new KommoModel(subdomain, token);
    instance.api = axios.create({
      baseURL: `https://${subdomain}.kommo.com/api/v4`,
      timeout: 10000,
      httpAgent: new http.Agent({ keepAlive: false }),
      httpsAgent: new https.Agent({ keepAlive: false }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    KommoModel.instances.set(key, instance);
    console.log(`🆕 Nova instacia criada para ${subdomain.toUpperCase()}`);

    return KommoModel.instances.get(key)!;
  }

  public static getActiveInstanceCount(): number {
    return KommoModel.instances.size;
  }

  public destroy(): void {
    const key = `${this.subdomain}:${this.token}`;

    // Cancela requisições pendentes
    const source = axios.CancelToken.source();
    source.cancel("Cleanup initiated");

    // Limpa referências
    this.api = null!;
    KommoModel.instances.delete(key);

    console.log(`♻️  Instância destruída`);
  }

  public static startInstanceMonitor(
    intervalMs: number = 60000
  ): NodeJS.Timeout {
    return setInterval(() => {
      console.log("📊 Estatísticas de Instâncias:");
      console.log(`• Total ativas: ${KommoModel.instances.size}`);
      console.log(
        `• Uso de memória: ${(
          process.memoryUsage().heapUsed /
          1024 /
          1024
        ).toFixed(2)} MB`
      );

      KommoModel.instances.forEach((instance, key) => {
        console.log(`   ➝ ${key} (${instance.api ? "ativo" : "inativo"})`);
      });
    }, intervalMs);
  }

  public static cleanupAll(): void {
    KommoModel.instances.forEach((instance) => instance.destroy());
    KommoModel.instances.clear();
    console.log("🧹 Todas as instâncias foram limpas");
  }

  async getContactById(contactId: number): Promise<any | null> {
    try {
      const response = await this.api.get(`/contacts/${contactId}`);
      if (!response.data || !response.data.id) {
        console.log("❌ Contato não encontrado");
        return null;
      }
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao buscar contato por ID:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao buscar contato por ID:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
  async buscarLeadPorId(leadId: number): Promise<any | null> {
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => source.cancel("Request timed out"), 10000); // 10-second timeout

    try {
      const response = await this.api.get(`/leads/${leadId}`, {
        params: { with: "contacts" },
        cancelToken: source.token,
      });

      if (!response.data.id) {
        console.log("❌ Lead não encontrado");
        return null;
      }

      return response.data;
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
      return null;
    } finally {
      clearTimeout(timeout); // Clear the timeout
    }
  }

  async buscarUsuarioPorNome(nome: string): Promise<any | null> {
    try {
      // Obtém todos os usuários
      const response = await this.api.get("/users");
      const usuarios = response.data._embedded?.users || [];

      if (usuarios.length === 0) {
        console.log("❌ Nenhum usuário encontrado.");
        return null;
      }

      // Filtra o usuário pelo nome exato (ou com includes se for parcial)
      const usuarioEncontrado = usuarios.find((user) => user.name === nome);

      if (!usuarioEncontrado) {
        console.log(`❌ Usuário "${nome}" não encontrado.`);
        return null;
      }

      return usuarioEncontrado;
    } catch (error: any) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao buscar usuario por nome:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌  Erro ao buscar usuario por nome:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
  async buscarLeadPorTelefone(telefone: string): Promise<any | null> {
    try {
      console.log("🔍 Buscando lead por telefone:", telefone);
      const response = await this.api.get(`/contacts`, {
        params: {
          query: telefone,
          with: "leads",
        },
      });
      if (!response.data || !response.data._embedded?.contacts || !response) {
        console.log("❌ Contato não encontrado");
        return null;
      } else {
        const contatos = response.data._embedded.contacts[0];
        if (contatos._embedded?.leads?.length > 0) {
          const leadId = contatos._embedded.leads[0].id;
          return await this.buscarLeadPorId(leadId);
        }
      }

      return null;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao buscar lead por telefone:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao buscar lead por telefone:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
  async buscarIdsPorNomesCampos(
    campos: { nomeCampo: string; enumNome?: string }[]
  ): Promise<
    {
      enumNome?: string;
      enumId?: number;
      type: string;
      nome: string;
      id: number;
    }[]
  > {
    try {
      const response = await this.api.get("/leads/custom_fields");

      if (!response.data?._embedded?.custom_fields) {
        console.warn("⚠️ Nenhum campo personalizado encontrado.");
        return [];
      }

      const camposMap = new Map(campos.map((c) => [c.nomeCampo, c.enumNome]));
      const camposEncontrados = response.data._embedded.custom_fields
        .filter((campo: any) => camposMap.has(campo.name)) // Verifica se o campo existe na lista
        .map((campo: any) => {
          const enumNome = camposMap.get(campo.name);

          if (campo.type !== "select") {
            return {
              nome: campo.name,
              id: campo.id,
              type: campo.type,
            };
          }

          // Buscar o ID do enum correspondente, se houver
          let enumId;
          if (campo.enums && enumNome) {
            const enumEncontrado = campo.enums.find(
              (e: any) => e.value === enumNome
            );
            enumId = enumEncontrado?.id; // Se não encontrar, enumId fica `undefined`
          }

          return {
            nome: campo.name,
            id: campo.id,
            enumId: enumId ?? null, // Retorna `null` se não houver enum correspondente
            type: campo.type,
            enumNome,
          };
        });

      return camposEncontrados;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao buscar id por nomes campos:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao buscar id por nomes campos:",
          error.response?.data || error
        );
      }
      return []; // Retorna um array vazio em caso de erro
    }
  }

  async listarGrupos(): Promise<any | null> {
    try {
      const response = await this.api.get("leads/custom_fields/groups");
      if (!response.data._embedded?.custom_field_groups) {
        console.log("❌ Nenhum grupo encontrado");
        return null;
      }
      return response.data._embedded.custom_field_groups;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao listar grupos:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao listar grupos:",
          error.response?.data || error
        );
      }
      return null;
    }
  }

  async getTaskById(taskId: number): Promise<any | null> {
    try {
      const response = await this.api.get(`/tasks/${taskId}`);
      if (!response.data || !response.data.id) {
        console.log("❌ Tarefa não encontrada");
        return null;
      }
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao buscar tarefa por ID:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao buscar tarefa por ID:",
          error.response?.data || error
        );
      }
      return null;
    }
  }

  async adicionarTask({
    text,
    leadId,
    responsible_user_id,
    result_text,
    complete_till = Math.floor(Date.now() / 1000),
  }: {
    text: string;
    leadId: number;
    responsible_user_id?: number;
    result_text?: string;
    complete_till?: number;
  }): Promise<any | null> {
    try {
      const taskData = [
        {
          text,
          entity_id: leadId,
          entity_type: "leads",
          complete_till: complete_till,
          result: { text: result_text },
          responsible_user_id,
        },
      ];
      const response = await this.api.post(`/tasks`, taskData);

      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao adicionar task:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao adicionar task:",
          error.response?.data || error
        );
      }
      return;
    }
  }

  async editTask({
    taskId,
    text,
    responsible_user_id,
    complete_till = Math.floor(Date.now() / 1000),
  }: {
    taskId: number;
    responsible_user_id?: number;
    text?: string;
    complete_till?: number;
  }): Promise<any | null> {
    try {
      const taskData = {
        text,
        responsible_user_id,
        complete_till: complete_till,
      };
      const response = await this.api.patch(`/tasks/${taskId}`, taskData);

      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao editar task:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error("❌ Erro ao editar task:", error.response?.data || error);
      }
      return null;
    }
  }

  async adicionarNota({
    leadId,
    text,
    typeNote = "extended_service_message",
  }: {
    leadId: number;
    text: string;
    typeNote?: string;
  }): Promise<any | null> {
    try {
      let noteData = [];
      if (typeNote === "common") {
        noteData = [
          {
            entity_id: leadId,
            note_type: typeNote, // Tipo de nota (pode ser ajustado)
            params: { text: text },
          },
        ];
      }
      if (typeNote === "extended_service_message") {
        noteData = [
          {
            entity_id: leadId,
            note_type: typeNote, // Tipo de nota (pode ser ajustado)
            params: { service: "Evo Result", text: text },
          },
        ];
      }
      const response = await this.api.post("/leads/notes", noteData);
      console.log("Nota adicionada com sucesso:", response.data);
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao adicionar nota:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao adicionar nota:",
          error.response?.data || error
        );
      }
      return null;
    }
  }

  async getCustomfields({
    entity_type,
  }: {
    entity_type: string;
  }): Promise<any | null> {
    try {
      const response = await this.api.get(`${entity_type}/custom_fields`);
      if (!response.data) {
        console.log("❌ Nenhum campo encontrado");
        return null;
      }
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao buscar campos personalisados:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao buscar campos personalisados:",
          error.response?.data || error
        );
      }
      return null;
    }
  }

  async cadastrarContact(body): Promise<any | null> {
    try {
      const response = await this.api.post("/contacts", body);
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao cadastrar contato:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao cadastrar contato:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
  async cadastrarPipeline(body): Promise<any | null> {
    try {
      const response = await this.api.post("/leads/pipelines", body);
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao cadastrar pipeline:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao cadastrar pipeline:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
  async cadastrarStatus(body, idPipeline): Promise<any | null> {
    try {
      const response = await this.api.post(
        `leads/pipelines/${idPipeline}/statuses`,
        body
      );
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao cadastrar status:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao cadastrar status:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
  async cadastrarLead(body: any): Promise<any | null> {
    try {
      const response = await this.api.post("/leads", body);
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao cadastrar lead:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao cadastrar lead:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
  async cadastrarLeadIncomingLeads(body): Promise<any | null> {
    try {
      const response = await this.api.post("/leads/unsorted/forms", body);
      const uid = response.data._embedded.unsorted[0].uid;
      const accepted = await this.api.post(`/leads/unsorted/${uid}/accept`);
      return accepted.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao cadastrar lead incoming:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao cadastrar lead incoming:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
  async getPipelines(): Promise<any | null> {
    try {
      const response = await this.api.get("/leads/pipelines");
      return response.data._embedded.pipelines;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao buscar pipelines:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao buscar pipelines:",
          error.response?.data || error
        );
      }
      return null;
    }
  }

  async getManagersWithGroup() {
    const response = await fetch(
      `https://${this.subdomain}.kommo.com/ajax/get_managers_with_group/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: new URLSearchParams({
          free_users: "Y", // ou remova esse campo se quiser todos os usuários
        }).toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async changeResponsibleUser(leadId: number, userId: number) {
    try {
      const response = await this.api.patch(`/leads/${leadId}`, {
        responsible_user_id: userId,
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao mudar usuario responsavel:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao mudar usuario responsavel:",
          error.response?.data || error
        );
      }
      return null;
    }
  }

  async runSalesBot(
    body: {
      bot_id: number;
      entity_id: number;
      entity_type: string;
    }[]
  ): Promise<any | null> {
    try {
      console.log("Iniciando SalesBot com os seguintes parâmetros:", body);

      const response = await this.api.post(
        `https://${this.subdomain}.kommo.com/api/v2/salesbot/run`,
        body
      );
      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
        console.error(
          "❌ Erro ao executar salesbot:",
          error.response.data["validation-errors"][0].errors
        );
      } else {
        console.error(
          "❌ Erro ao executar salesbot:",
          error.response?.data || error
        );
      }
      return null;
    }
  }
}
