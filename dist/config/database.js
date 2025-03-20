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
function descriptografarToken(token) {
    const secretKey = process.env.SECRET_KEY;
    return CryptoJS.AES.decrypt(token, secretKey).toString(CryptoJS.enc.Utf8);
}
export const db = async (text, params) => {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res.rows;
    }
    finally {
        client.release();
    }
};
export const getClientesTintim = async () => {
    const response = await db("SELECT nome,token FROM clientes where tintim = true");
    return response.map((cliente) => {
        return {
            nome: cliente.nome,
            token: descriptografarToken(cliente.token),
        };
    });
};
