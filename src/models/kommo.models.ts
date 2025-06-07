import axios, { AxiosInstance } from "axios";
import { query } from "express";

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
}

export class KommoModel {
  public api: AxiosInstance;
  constructor(private subdomain: string, private token: string) {
    this.api = axios.create({
      baseURL: `https://${this.subdomain}.kommo.com/api/v4`,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });
  }

  async buscarLeadPorId(leadId: number): Promise<any | null> {
    try {
      const response = await this.api.get(`/leads/${leadId}`, {
        params: {
          with: "contacts",
        },
      });

      if (!response.data.id) {
        console.log("❌ Lead não encontrado");
        return null;
      }

      return response.data;
    } catch (error) {
      if (error.response?.data?.["validation-errors"]) {
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
      return;
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

      if (
        !response ||
        !response.data ||
        !response.data._embedded?.contacts?.length
      ) {
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
          is_completed: true,
          responsible_user_id,
        },
      ];
      const response = await this.api.post(`/tasks`, taskData);

      // return response.data;
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
  async cadastrarLead(body): Promise<any | null> {
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
}
