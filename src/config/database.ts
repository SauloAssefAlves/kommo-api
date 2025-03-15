import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

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
  return await db("SELECT nome,token FROM clientes where tintim = true");
};
