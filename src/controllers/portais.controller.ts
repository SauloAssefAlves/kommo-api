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
    const html = atob(req.body.html);
    // const text = req.body[0].text;
    const address = req.body.from.address;
    const origem = await this.obterOrigem(address);
    console.log("🔍", origem);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // pode usar "gpt-3.5-turbo" se preferir
      messages: [
        {
          role: "system",
          content: `
                    A partir do HTML abaixo, extraia os seguintes campos: nome, telefone, carro, valor e email.
                    **Regras**:
                    1. O valor do carro deve ser apenas um número inteiro, sem os centavos.
                    2. carro de interesse ,no objeto json, deve ser somente carro.
                    3. Retire o DDI do telefone e mantenha apenas o NÚMERO. sem hifens.
                    4. O telefone deve ser apenas números, sem espaços ou caracteres especiais.
                    Retorne apenas um objeto com esses campos. Não explique nada, somente uma chave {} com os campos dentro.
                    HTML:${html}
                    `,
        },
      ],
    });
    const extractedData = JSON.parse(response.choices[0].message.content);
    const { nome, telefone, carro, valor, email } = extractedData;

    console.log(extractedData);

    const testTelefone = "85996400751";
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

      console.log("🔍", numero);
      return numero;
    };

    const telefoneTratado = tratarTelefone(testTelefone);
    const leadExistente = await this.clienteModel.buscarLeadPorTelefone(
      telefoneTratado
    );
    console.log("🔍", telefoneTratado);

    const noteText = `ℹ Nova conversão de formulário com sucesso!

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



    if (!leadExistente) {
      const { id } = leadExistente;
      await this.clienteModel.adicionarNota({
        leadId: id,
        text: noteText,
        typeNote: "common",
      });
    } //asasas
    
    //     } else {
    //       const customFiledsContacts = await this.clienteModel.getCustomfields({
    //         entity_type: "contacts",
    //       });

    //       const customFiledsLead = await this.clienteModel.getCustomfields({
    //         entity_type: "leads",
    //       });

    //       const origemField = customFiledsLead._embedded.custom_fields.find(
    //         (field: any) => field.name === "Origem"
    //       )?.id;

    //       const veiculoField = customFiledsLead._embedded.custom_fields.find(
    //         (field: any) => field.name === "Veículo"
    //       )?.id;

    //       const phoneField = customFiledsContacts._embedded.custom_fields.find(
    //         (field: any) => field.code === "PHONE"
    //       )?.id;

    //       const emailField = customFiledsContacts._embedded.custom_fields.find(
    //         (field: any) => field.code === "EMAIL"
    //       )?.id;

    //       const bodyContact = [
    //         {
    //           name: "teste",
    //           custom_fields_values: [
    //             {
    //               field_id: phoneField,
    //               values: [
    //                 {
    //                   value: telefone,
    //                 },
    //               ],
    //             },
    //             {
    //               field_id: emailField,
    //               values: [
    //                 {
    //                   value: email,
    //                 },
    //               ],
    //             },
    //           ],
    //         },
    //       ];

    //       console.log(veiculoField, origemField, phoneField, emailField); //ids

    //       const contact = await this.clienteModel.cadastrarContact(
    //         JSON.stringify(bodyContact)
    //       );
    //       const pipelines = await this.clienteModel.getPipelines();

    //       const pipeline = pipelines.find(
    //         (pipeline: any) => pipeline.id === pipeline_id
    //       );
    //       const status = pipeline._embedded.statuses.find(
    //         (status: any) => status.id === status_id
    //       );

    //       const contactId = contact._embedded.contacts[0].id;
    //       console.log("🔍", pipeline, status, contactId, phoneField, telefone);
    //       const bodyLead = [
    //         {
    //           name: "teste saulo", //nome
    //           price: valor,
    //           status_id: status_id,
    //           pipeline_id: pipeline_id,
    //           _embedded: {
    //             contacts: [
    //               {
    //                 id: contactId,
    //               },
    //             ],
    //           },
    //           custom_fields_values: [
    //             {
    //               field_id: origemField,
    //               values: [
    //                 {
    //                   value: "PORTAIS",
    //                 },
    //               ],
    //             },
    //             {
    //               field_id: veiculoField,
    //               values: [
    //                 {
    //                   value: carro,
    //                 },
    //               ],
    //             },
    //           ],
    //         },
    //       ];

    //       const lead = await this.clienteModel.cadastrarLead(
    //         JSON.stringify(bodyLead)
    //       );
    //       const leadId = lead._embedded.leads[0].id;

    //       const noteTextLead = `ℹ Novo Lead (ID ${leadId})

    // ----
    // Dados do formulário preenchido:

    // Veículo: ${carro}
    // Nome: ${nome}
    // Telefone: ${telefone}
    // Mensagem: Veja abaixo informações de um cliente que acessou o número de contato ou WhatsApp da sua loja.

    // ----

    // Mídia: Portais
    // Origem: ${origem}
    // Anúncio: ${carro} - R$ ${valor}`;

    //       await this.clienteModel.adicionarNota({
    //         leadId: leadId,
    //         text: noteTextLead,
    //         typeNote: "common",
    //       });
    //     }
  }
}
