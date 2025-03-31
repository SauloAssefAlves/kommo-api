import app from "./app.js";
import "dotenv/config";
const port = Number(process.env.PORT);


app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
