import axios from "axios";
import https from "https";
interface User {
  id: number;
  email: string;
  admin: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
  provider: string | null;
  uid: string | null;
  name: string;
  pessoa_id: number;
  cd_usuario: number | null;
  role_id: number | null;
  avatar: string | null;
  modulo_id: number;
  empresa_id: number;
  foto_file_name: string | null;
  foto_content_type: string | null;
  foto_file_size: number | null;
  foto_updated_at: string | null;
  impressora_ingressos: string | null;
  authentication_token: string | null;
  loja: string | null;
  recaptcha_token: string | null;
  apns_token: string | null;
}

interface LoginResponse {
  token?: string;
  user?: User;
}

export async function loginSws(email, password): Promise<string | void> {
  try {
    const response = await fetch(
      "https://apiteste.sociofortaleza.com.br/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: LoginResponse = await response.json();
    const newToken = data.token;
    if (newToken) {
      console.log("Login bem-sucedido. Novo token obtido.");
      return newToken;
    } else {
      console.log("Token não encontrado.");
    }
  } catch (error) {
    console.error("Erro de requisição:", error);
  }
}
