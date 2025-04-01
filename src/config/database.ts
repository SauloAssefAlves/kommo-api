import pkg from "pg";
import dotenv from "dotenv";
import CryptoJS from "crypto-js";
dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});
function descriptografarToken(token: string): string {
  const secretKey = process.env.SECRET_KEY as string;
  return CryptoJS.AES.decrypt(token, secretKey).toString(CryptoJS.enc.Utf8);
}

export const db = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
};

export const getClientesTintim = async () => {
  const response = await db(
    `SELECT u.nome AS unidade_nome, u.empresa_id, u.todas_unidades, c.token, u.unidade_formatada, u.contador, u.id
      FROM tintim_unidades u
      JOIN clientes c ON c.id = u.empresa_id`
  );
  return response.map((cliente) => {
    return {
      id: cliente.id,
      nome: cliente.unidade_formatada,
      token: descriptografarToken(cliente.token),
      contador: cliente.contador,
    };
  });
};

export async function incrementarContadorUnidade(unidade_id: number) {
  await db("UPDATE tintim_unidades SET contador = contador + 1 WHERE id = $1", [
    unidade_id,
  ]);
}
