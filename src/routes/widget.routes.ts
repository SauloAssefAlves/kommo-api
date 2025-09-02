import { Router, Request, Response } from "express";
const router = Router();

router.post("/customChatLive", (req: Request, res: Response) => {
  // Lógica de custom ChatLive
  // Define o tipo de conteúdo como JavaScript
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600"); // Cache por 1 hora
  // Script de configuração do chat
  const chatConfig = `
window.crmPluginConfig = {
  hidden: false,
  color: '#FF6600',
  onlinechat: {
    mode: 'widget',
    locale: {
      extends: 'pt',
      compose_placeholder: 'Escreva sua dúvida...'
    },
    theme: {
      header: { 
        background: '#222', 
        color: '#fff' 
      },
      message: {
        outgoing_background: '#007bff',
        outgoing_color: '#fff',
        incoming_background: '#f1f1f1',
        incoming_color: '#000'
      },
      compose: { 
        height: 60, 
        button_background: '#FF6600' 
      }
    }
  }
};

// Log para debug (opcional)
console.log('Chat config carregado:', window.crmPluginConfig);
`;

  res.send(chatConfig);
});

export default router;
