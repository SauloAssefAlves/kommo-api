import pkg from "pg";
import CryptoJS from "crypto-js";

const { Pool } = pkg;

// Configuração mais robusta do pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  max: 10, // Limita o número de conexões simultâneas
  idleTimeoutMillis: 10000, // Fecha conexões ociosas após 10s
  connectionTimeoutMillis: 2000, // Timeout para tentar nova conexão
});

// Função de consulta ao banco com tratamento de erro
export const db = async (text: string, params?: any[]): Promise<any[]> => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } catch (err) {
    console.error("Erro na consulta ao banco:", {
      query: text,
      params,
      error: err,
    });
    throw err; // Repassa o erro para tratamento no nível superior
  } finally {
    client.release();
  }
};

export function descriptografarToken(token: string): string {
  const secretKey = process.env.SECRET_KEY as string;
  return CryptoJS.AES.decrypt(token, secretKey).toString(CryptoJS.enc.Utf8);
}

export const getClientesTintim = async () => {
  const response = await db(
    `SELECT u.nome AS unidade_nome, u.empresa_id, u.todas_unidades, c.token, u.unidade_formatada, u.contador, u.id ,c.nome as cliente_nome
      FROM tintim_unidades u
      JOIN clientes c ON c.id = u.empresa_id`
  );
  return response.map((cliente) => {
    return {
      id: cliente.id,
      nome: cliente.unidade_formatada,
      token: descriptografarToken(cliente.token),
      contador: cliente.contador,
      cliente_nome: cliente.cliente_nome,
      empresa_id: cliente.empresa_id,
    };
  });
};

export const getClientesPortais = async () => {
  const response = await db(
    `select c.id, c.nome , cp.nome as unidade_nome, cp.pipeline, cp.status_pipeline , c.token, cp.type from clientes_portais cp inner join clientes c on c.id = cp.empresa_id`
  );
  return response.map((cliente) => {
    return {
      nome: cliente.unidade_nome,
      token: descriptografarToken(cliente.token),
      pipeline_id: cliente.pipeline,
      cliente_nome: cliente.unidade_nome,
      status_id: cliente.status_pipeline,
      type: cliente.type,
      empresa_id: cliente.id,
    };
  });
};

export const adicionarDataTintim = async (data, id) => {
  const response = await db(
    `  UPDATE tintim_unidades
            SET data_ultimo_tintim = $1
            WHERE empresa_id = $2
            RETURNING *; -- Retorna a linha atualizada (opcional)`,
    [data, id]
  );
  return response;
};

export const adicionarDataPortais = async (data, id) => {
  const response = await db(
    `  UPDATE clientes_portais
            SET data_ultimo_lead = $1
            WHERE empresa_id = $2
            RETURNING *; -- Retorna a linha atualizada (opcional)`,
    [data, id]
  );
  return response;
};

export async function incrementarContadorUnidade(unidade_id: number) {
  await db("UPDATE tintim_unidades SET contador = contador + 1 WHERE id = $1", [
    unidade_id,
  ]);
}

type MonitoramentoPortais = {
  empresa_id: number;
  nome_lead: string;
  telefone: string;
  veiculo: string;
  origem: string;
  midia: string;
  valor: number;
  integrado: boolean;
  causa?: string;
};

export async function addMonitoramentoPortais(data: MonitoramentoPortais) {
  const {
    empresa_id,
    nome_lead,
    telefone,
    veiculo,
    origem,
    midia,
    valor,
    integrado,
    causa,
  } = data;

  await db(
    `INSERT INTO monitoramento_portais (
      empresa_id,
      nome_lead,
      telefone,
      veiculo,
      origem,
      midia,
      valor,
      integrado,
      causa
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    );`,
    [
      empresa_id,
      nome_lead,
      telefone,
      veiculo,
      origem,
      midia,
      valor || 0.0,
      integrado,
      causa || "N/A",
    ]
  );
  console.log("Monitoramento Portais adicionado com sucesso:");
}

type MonitoramentoTintim = {
  nome_campanha: string;
  nome_conjunto: string;
  nome_anuncio: string;
  id_lead?: number;
  nome_lead: string;
  integrado: boolean;
  causa?: string;
  empresa_id: number;
  telefone: string;
  source: string;
  midia: string;
  origem: string;
};
export async function addMonitoramentoTintim(data: MonitoramentoTintim) {
  const {
    nome_campanha,
    nome_conjunto,
    nome_anuncio,
    id_lead,
    nome_lead,
    integrado,
    causa,
    empresa_id,
    telefone,
    source,
    midia,
    origem
  } = data;

  await db(
    `INSERT INTO monitoramento_tintim (
      nome_campanha,
      nome_conjunto,
      nome_anuncio,
      id_lead,
      nome_lead,
      integrado,
      causa,
      empresa_id,
      telefone,
      source,
      midia,
      origem
    ) VALUES (
      $1, $2, $3, $4, $5, $6 ,$7, $8, $9, $10, $11, $12
    );`,
    [
      nome_campanha,
      nome_conjunto,
      nome_anuncio,
      id_lead || null,
      nome_lead,
      integrado,
      causa || null,
      empresa_id,
      telefone,
      source,
      midia,
      origem,
    ]
  );
}
