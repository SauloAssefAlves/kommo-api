import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

// Função para extrair token CSRF dos cookies
function extractCsrfToken(cookies: string): string | null {
  const match = cookies.match(/csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

router.post(
  "/customChatLiveSimple",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { id, subdomain = "evoresultdev", cookies } = req.body;

      if (!id) {
        return res.status(400).json({
          error: "Parâmetro 'id' é obrigatório",
        });
      }

      if (!cookies) {
        return res.status(400).json({
          error: "Cookies são obrigatórios",
        });
      }

      // Verificar se pelo menos temos user_id
      const userIdMatch = cookies.match(/amo_user_id=([^;]+)/);
      if (!userIdMatch) {
        return res.status(400).json({
          error: "User ID não encontrado nos cookies",
        });
      }

      const userId = userIdMatch[1];
      console.log(`👤 User ID encontrado: ${userId}`);

      // Tentar diferentes endpoints que podem não precisar de autenticação completa
      const endpoints = [
        `/ajax/settings/pipeline/button/settings/?id=${id}`,
        `/api/v4/leads/pipelines/${id}`,
        `/ajax/pipeline/settings/?id=${id}`,
        `/settings/pipeline/${id}/data`,
      ];

      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Tentando endpoint: ${endpoint}`);

          const response = await axios.get(
            `https://${subdomain}.kommo.com${endpoint}`,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Accept: "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
                "X-Requested-With": "XMLHttpRequest",
                Referer: `https://${subdomain}.kommo.com/settings/`,
                Cookie: cookies,
              },
              timeout: 10000,
              validateStatus: (status) => status < 500,
            }
          );

          // Se conseguiu resposta válida
          if (response.status === 200) {
            const contentType = response.headers["content-type"] || "";

            // Verifica se não é página de login
            if (contentType.includes("text/html")) {
              const htmlContent = response.data.toString();
              if (
                htmlContent.includes("Autorização") ||
                htmlContent.includes("login")
              ) {
                continue; // Tenta próximo endpoint
              }
            }

            console.log(`✅ Sucesso no endpoint: ${endpoint}`);
            return res.json({
              success: true,
              data: response.data,
              status: response.status,
              endpoint: endpoint,
              userId: userId,
              debug: {
                contentType,
                dataLength: JSON.stringify(response.data).length,
              },
            });
          }
        } catch (error) {
          console.log(`❌ Falha no endpoint ${endpoint}:`, error.message);
          lastError = error;
          continue;
        }
      }

      // Se todos os endpoints falharam
      return res.status(401).json({
        success: false,
        error: "Todos os endpoints falharam",
        message: "Não foi possível acessar dados sem autenticação completa",
        userId: userId,
        testedEndpoints: endpoints,
        lastError: lastError?.message,
      });
    } catch (error) {
      console.error("❌ Erro geral:", error.message);
      res.status(500).json({
        success: false,
        error: "Erro interno",
        message: error.message,
      });
    }
  }
);

// Rota para tentar fazer login automaticamente
router.post("/autoLogin", async (req: Request, res: Response): Promise<any> => {
  try {
    const { subdomain = "evoresultdev", cookies } = req.body;

    console.log("🔐 Tentando fazer login automático...");

    // Verificar se já temos cookies básicos
    const userIdMatch = cookies.match(/amo_user_id=([^;]+)/);
    if (!userIdMatch) {
      return res.status(400).json({
        error: "User ID necessário para login automático",
      });
    }

    const userId = userIdMatch[1];

    // Tentar acessar página de dashboard para forçar autenticação
    const response = await axios.get(
      `https://${subdomain}.kommo.com/dashboard/`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          Cookie: cookies,
        },
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      }
    );

    // Extrair novos cookies da resposta
    const setCookieHeaders = response.headers["set-cookie"];
    let newCookies = cookies;

    if (setCookieHeaders) {
      setCookieHeaders.forEach((cookie) => {
        const cookiePair = cookie.split(";")[0];
        const [name, value] = cookiePair.split("=");

        if (["session_id", "access_token", "csrf_token"].includes(name)) {
          console.log(`🍪 Novo cookie encontrado: ${name}`);
          newCookies += `; ${cookiePair}`;
        }
      });
    }

    res.json({
      success: true,
      message: "Tentativa de login automático concluída",
      originalCookies: cookies,
      newCookies: newCookies,
      status: response.status,
      hasCookieUpdates: newCookies !== cookies,
    });
  } catch (error) {
    console.error("❌ Erro no login automático:", error.message);
    res.status(500).json({
      success: false,
      error: "Erro no login automático",
      message: error.message,
    });
  }
});
export default router;
