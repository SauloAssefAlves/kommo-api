import { KommoModel } from "../models/kommo.models.js";
import { Response, Request } from "express";
import openai from "../config/openai.js";
export class PortaisController {
  constructor(private clienteModel: KommoModel) {}
  async obterOrigem(fromAddress: string): Promise<string> {
    let origem: string;

    switch (fromAddress) {
      case "noreply@olx.com.br":
        origem = "Portal - OLX";
        break;

      case "carros@icarros.com.br":
        origem = "Portal - iCarros";
        break;

      case "propostas@usadosbr.com":
        origem = "Portal - UsadosBR";
        break;

      case "nospam@chavesnamao.com.br":
        origem = "Portal - Chaves na mão";
        break;

      case "contato@mobiauto.com.br":
        origem = "Portal - Mobiauto";
        break;

      case "alertaproposta@webmotors.com.br":
        origem = "Portal - Webmotors";
        break;

      case "noreply@napista.com.br":
        origem = "Portal - NaPista";
        break;

      default:
        origem = "Origem desconhecida";
    }

    return origem;
  }

  async atualizarFiledsWebhookPortais(
    req: Request,
    res: Response,
    cliente: any
  ): Promise<any> {
    const pipeline_id = Number(cliente.pipeline_id);
    const status_id = cliente.status_id;
    const type_status = cliente.type;
    const html = Buffer.from(req.body.html, "base64").toString();
    // const text = req.body[0].text;
    const address = req.body.from.address;
    const origem = await this.obterOrigem(address);

    const maxRetries = 5;
    let attempts = 0;
    let extractedData: any;

    while (attempts < maxRetries) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini", // pode usar "gpt-3.5-turbo" se preferir
          messages: [
            {
              role: "system",
              content: `
          Você é um assistente que processa HTML e extrai informações específicas. 
          A partir do HTML fornecido, extraia os seguintes campos: nome, telefone, carro, valor e email.
          Regras obrigatórias:
          1. O valor do carro deve ser um NÚMERO INTEIRO, sem os centavos.
          2. O campo "carro" no objeto JSON deve conter apenas o modelo do carro, sem marca ou outras informações adicionais. Por exemplo, para "CHEVROLET ONIX ADVANTAGE", o campo "carro" deve conter apenas "ONIX ADVANTAGE".
          3. O telefone deve conter apenas números, sem DDI, espaços, hifens ou caracteres especiais.
          4. Sempre retorne um JSON válido com os campos {nome, telefone, carro, valor, email}.
          5. Não inclua explicações ou texto adicional, apenas o JSON.
          HTML:${html}
              `,
            },
          ],
        });

        // Remove aspas desnecessárias do JSON retornado
        const rawContent = response.choices[0].message.content;
        const cleanedContent = rawContent.replace(/“|”|```|json/g, "").trim();
        extractedData = JSON.parse(cleanedContent);
        console.log("⭐", extractedData);

        if (
          typeof extractedData === "object" &&
          !Array.isArray(extractedData)
        ) {
          break; // Exit loop if valid JSON is received
        } else {
          throw new Error("Resposta não é um JSON válido.");
        }
      } catch (error) {
        attempts++;
        console.error(`Erro ao extrair dados (tentativa ${attempts}):`, error);
        if (attempts >= maxRetries) {
          throw new Error(
            "Falha ao processar os dados extraídos do HTML após várias tentativas."
          );
        }
      }
    }
    const { nome, telefone, carro, valor, email } = extractedData;

    // Remove o DDI, mantém o DDD e remove o 9 após o DDD, caso tenha
    const tratarTelefone = (telefone: string): string => {
      // Remove caracteres não numéricos
      let numero = telefone;

      // Remove o DDI (assumindo que o DDI tem até 3 dígitos no início)
      if (numero.length > 11) {
        numero = numero.slice(-11);
      }

      // Verifica se o número tem 11 dígitos e começa com o 9 após o DDD
      if (numero.length === 11 && numero[2] === "9") {
        numero = numero.slice(0, 2) + numero.slice(3); // Remove o 9 após o DDD
      }

      if (numero.length === 9 && numero[0] === "9") {
        numero = numero.slice(1); // Remove o 9 inicial
      }

      console.log("🔍", numero);
      return numero;
    };

    const telefoneTratado = tratarTelefone(telefone);

    const leadExistente = await this.clienteModel.buscarLeadPorTelefone(
      telefoneTratado
    );

    const noteText = `ℹ Nova conversão de formulário com sucesso!

      ----
      Dados do formulário preenchido:

      Veículo: ${carro}
      Nome: ${nome}
      Telefone: ${telefoneTratado}
      Mensagem: Veja abaixo informações de um cliente que acessou o número de contato ou WhatsApp da sua loja.

      ----

      Mídia: Portais
      Origem: ${origem}
      Anúncio: ${carro} - R$ ${valor}`;

    if (leadExistente) {
      const { id } = leadExistente;
      await this.clienteModel.adicionarNota({
        leadId: id,
        text: noteText,
        typeNote: "common",
      });
    } else {
      const customFiledsLead = await this.clienteModel.getCustomfields({
        entity_type: "leads",
      });

      const origemField = customFiledsLead._embedded.custom_fields.find(
        (field: any) => field.name === "Origem"
      );

      const midiaFiled = customFiledsLead._embedded.custom_fields.find(
        (field: any) => field.name === "Midia"
      );

      const veiculoField = customFiledsLead._embedded.custom_fields.find(
        (field: any) => field.name === "Modelo (VN)"
      )?.id;

      const customFiledsContacts = await this.clienteModel.getCustomfields({
        entity_type: "contacts",
      });

      const phoneField = customFiledsContacts._embedded.custom_fields.find(
        (field: any) => field.code === "PHONE"
      )?.id;

      const emailField = customFiledsContacts._embedded.custom_fields.find(
        (field: any) => field.code === "EMAIL"
      )?.id;

      const bodyContact = [
        {
          name: nome,
          custom_fields_values: [
            {
              field_id: phoneField,
              values: [
                {
                  value: `+55${telefoneTratado}`,
                },
              ],
            },
            {
              field_id: emailField,
              values: [
                {
                  value: email,
                },
              ],
            },
          ],
        },
      ];

      const contact = await this.clienteModel.cadastrarContact(
        JSON.stringify(bodyContact)
      );
      const pipelines = await this.clienteModel.getPipelines();

      const pipeline = pipelines.find(
        (pipeline: any) => pipeline.id === pipeline_id
      );
      const status = pipeline._embedded.statuses.find(
        (status: any) => status.id === status_id
      );

      const contactId = contact._embedded.contacts[0].id;

      // -------------------- CASO NÃO TENHA OS CAMPOS PADRÕES --------------------
      if (!origemField || !midiaFiled || !veiculoField) {
        let leadId: number;
        if (type_status === 1) {
          const bodyLead = [
            {
              source_uid: "custom_api_form",
              source_name: "Formulário do Site",
              pipeline_id: pipeline_id,
              metadata: {
                form_sent_at: Date.now(),
                category: "forms",
                form_id: "form-site-contato",
                form_name: "Formulário de Contato",
                form_page: "https://meusite.com/contato",
                referer: "https://meusite.com/",
                ip: "192.168.0.1",
              },
              _embedded: {
                leads: [
                  {
                    name: nome,
                    price: parseInt(valor, 10),
                    pipeline_id: pipeline_id,
                    _embedded: {
                      contacts: [
                        {
                          id: contactId,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ];

          const lead = await this.clienteModel.cadastrarLeadIncomingLeads(
            JSON.stringify(bodyLead)
          );
          leadId = lead._embedded.leads[0].id;
          console.log("🚀 Incoming Lead criado com sucesso:", lead);
        } else {
          const bodyLeadSemCamposPadroes = [
            {
              name: nome,
              price: parseInt(valor, 10),
              status_id: status_id,
              pipeline_id: pipeline_id,
              _embedded: {
                contacts: [
                  {
                    id: contactId,
                  },
                ],
              },
            },
          ];
          const lead = await this.clienteModel.cadastrarLead(
            JSON.stringify(bodyLeadSemCamposPadroes)
          );

          leadId = lead._embedded.leads[0].id;
        }
        const noteTextLead = `ℹ Novo Lead (ID ${leadId})

        ----
        Dados do formulário preenchido:

        Veículo: ${carro}
        Nome: ${nome}
        Telefone: ${telefone}
        Mensagem: Veja abaixo informações de um cliente que acessou o número de contato ou WhatsApp da sua loja.

        ----

        Mídia: Portais
        Origem: ${origem}
        Anúncio: ${carro} - R$ ${valor}`;

        await this.clienteModel.adicionarNota({
          leadId: leadId,
          text: noteTextLead,
          typeNote: "common",
        });

        console.log("Novo lead criado");

        // -------------------- CASO TENHA OS CAMPOS PADRÕES --------------------
      } else {
        const origemEnum = origemField.enums.find(
          (enumItem: any) => enumItem.value === origem
        );
        const midiaEnum = midiaFiled.enums.find(
          (enumItem: any) => enumItem.value === "Portais"
        );
        let leadId: number;
        if (type_status === 1) {
          const bodyLead = [
            {
              source_uid: "custom_api_form",
              source_name: "Formulário do Site",
              pipeline_id: pipeline_id,
              metadata: {
                form_sent_at: Date.now(),
                category: "forms",
                form_id: "form-site-contato",
                form_name: "Formulário de Contato",
                form_page: "https://meusite.com/contato",
                referer: "https://meusite.com/",
                ip: "192.168.0.1",
              },
              _embedded: {
                leads: [
                  {
                    name: nome,
                    price: parseInt(valor, 10),
                    pipeline_id: pipeline_id,
                    _embedded: {
                      contacts: [
                        {
                          id: contactId,
                        },
                      ],
                    },
                    custom_fields_values: [
                      {
                        field_id: origemField.id,
                        values: [
                          {
                            enum_id: origemEnum.id,
                            value: origemEnum.value,
                          },
                        ],
                      },
                      {
                        field_id: midiaFiled.id,
                        values: [
                          {
                            enum_id: midiaEnum.id,
                            value: midiaEnum.value,
                          },
                        ],
                      },
                      {
                        field_id: veiculoField,
                        values: [
                          {
                            value: carro,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ];

          const lead = await this.clienteModel.cadastrarLeadIncomingLeads(
            JSON.stringify(bodyLead)
          );

          console.log("🚀 Incoming Lead criado com sucesso:", lead);
          leadId = lead._embedded.leads[0].id;
        } else {
          const bodyLead = [
            {
              name: nome,
              price: parseInt(valor, 10),
              status_id: status_id,
              pipeline_id: pipeline_id,
              _embedded: {
                contacts: [
                  {
                    id: contactId,
                  },
                ],
              },
              custom_fields_values: [
                {
                  field_id: origemField.id,
                  values: [
                    {
                      enum_id: origemEnum.id,
                      value: origemEnum.value,
                    },
                  ],
                },
                {
                  field_id: midiaFiled.id,
                  values: [
                    {
                      enum_id: midiaEnum.id,
                      value: midiaEnum.value,
                    },
                  ],
                },
                {
                  field_id: veiculoField,
                  values: [
                    {
                      value: carro,
                    },
                  ],
                },
              ],
            },
          ];

          const lead = await this.clienteModel.cadastrarLead(
            JSON.stringify(bodyLead)
          );
          leadId = lead._embedded.leads[0].id;
        }
        const noteTextLead = `ℹ Novo Lead (ID ${leadId})

        ----
        Dados do formulário preenchido:

        Veículo: ${carro}
        Nome: ${nome}
        Telefone: ${telefone}
        Mensagem: Veja abaixo informações de um cliente que acessou o número de contato ou WhatsApp da sua loja.

        ----

        Mídia: Portais
        Origem: ${origem}
        Anúncio: ${carro} - R$ ${valor}`;

        await this.clienteModel.adicionarNota({
          leadId: leadId,
          text: noteTextLead,
          typeNote: "common",
        });

        console.log("👍 Novo lead criado");
      }
    }
  }
}
