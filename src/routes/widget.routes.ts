import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

router.post(
  "/customChatLive",
  async (req: Request, res: Response): Promise<any> => {
    try {
      // Extrai parâmetros do body da requisição
      const { id, subdomain = "evoresultdev", cookies } = req.body;
      console.log("Cookies enviados:", cookies);

      // Validações
      if (!id) {
        return res.status(400).json({
          error: "Parâmetro 'id' é obrigatório",
        });
      }

      // URL correta da API de configurações de pipeline
      const kommoUrl = `https://${subdomain}.kommo.com/ajax/settings/pipeline/button/settings/`;
      const params = new URLSearchParams({
        id: id.toString(),
      });

      console.log(`Fazendo requisição para: ${kommoUrl}?${params.toString()}`);

      // Headers para a requisição
      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `https://${subdomain}.kommo.com/`,
        ...(cookies && { Cookie: cookies }),
      };

      // Faz a requisição para a Kommo
      const response = await axios.get(`${kommoUrl}?${params.toString()}`, {
        headers,
        timeout: 10000, // 10 segundos de timeout
        validateStatus: (status) => status < 500, // Aceita códigos até 499
      });

      // Retorna os dados da Kommo
      res.json({
        success: true,
        data: response.data,
        status: response.status,
        url: `${kommoUrl}?${params.toString()}`,
      });
    } catch (error) {
      console.error("Erro na requisição customChatLive:", error);

      if (error.response) {
        // Erro de resposta da API
        res.status(error.response.status).json({
          success: false,
          error: "Erro na API da Kommo",
          details: error.response.data,
          status: error.response.status,
        });
      } else if (error.request) {
        // Erro de rede
        res.status(503).json({
          success: false,
          error: "Erro de conexão com a Kommo",
          message: "Não foi possível conectar com o servidor da Kommo",
        });
      } else {
        // Erro geral
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          message: error.message,
        });
      }
    }
  }
);

export default router;
