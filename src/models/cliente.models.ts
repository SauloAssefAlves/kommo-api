import axios, { AxiosInstance } from "axios";
import { query } from "express";

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
}

export class ClienteModel {
  public api: AxiosInstance;
  constructor(private subdomain: string, private token: string) {
    this.api = axios.create({
      baseURL: `https://${this.subdomain}.kommo.com/api/v4`,
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
      console.error("Erro ao buscar lead por ID:", error);
      return;
    }
  }
  async buscarUsuarioPorNome(nome: string): Promise<any | null> {
    try {
      const response = await this.api.get("/users", {
        params: { query: nome },
      });

      const usuarios = response.data._embedded?.users;

      if (!usuarios || usuarios.length === 0) {
        console.log("❌ Usuário não encontrado");
        return null;
      }

      return usuarios[0]; // Retorna o primeiro usuário encontrado
    } catch (error: any) {
      console.error(
        "Erro ao buscar usuário por nome:",
        error.response?.data || error
      );
      return null;
    }
  }
  async buscarLeadPorTelefone(telefone: string): Promise<any | null> {
    try {
      const formattedPhone = telefone
        .replace(/^55/, "")
        .replace(/^(\d{2})9?(\d{8})$/, (_, ddd, numero) => {
          return parseInt(ddd) >= 31 ? `${ddd}${numero}` : `${ddd}9${numero}`;
        });
      console.log("🔍 Buscando lead por telefone:", formattedPhone);
      const response = await this.api.get(`/contacts`, {
        params: {
          query: formattedPhone,
          with: "leads",
        },
      });
      const contatos = response.data._embedded?.contacts[0];

      if (!contatos) {
        console.log("❌ Contato não encontrado");
        return null;
      }
      if (contatos._embedded?.leads?.length > 0) {
        const leadId = contatos._embedded.leads[0].id;
        return await this.buscarLeadPorId(leadId);
      }

      return null;
    } catch (error) {
      console.error("Erro ao buscar contato por telefone:", error);
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
      console.error("❌ Erro ao buscar IDs dos campos:", error);
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

      return response.data;
    } catch (error) {
      console.error("Erro ao adicionar task:", error);
      return;
    }
  }
  async adicionarNota({
    leadId,
    text,
  }: {
    leadId: number;
    text: string;
  }): Promise<any | null> {
    try {
      const noteData = [
        {
          entity_id: leadId,
          note_type: "extended_service_message", // Tipo de nota (pode ser ajustado)
          params: { service: "EVO Result", text: text },
        },
      ];

      const response = await this.api.post("/leads/notes", noteData);

      return response.data;
    } catch (error) {
      console.error("❌ Erro ao adicionar nota:", error);
      return null;
    }
  }
}
