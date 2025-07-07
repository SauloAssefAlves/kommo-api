export function getTipoAdesaoPorNome(statusNomeEnum) {
  // Converte para minúsculas para garantir que a comparação não falhe por causa de maiúsculas/minúsculas.
  const statusNormalizado = statusNomeEnum.toLowerCase();

  switch (statusNormalizado) {
    case "nova_adesao":
      return "Nova";
    case "renovada": // O enum tem 'renovada', que corresponde a 'Renovação' no Kommo.
      return "Renovação";
    case "quitada":
      return "Quitada";
    case "inadimplente":
      return "Inadiplente";
    case "cancelada":
      return "Cancelada";
    case "vencida":
      return "Vencida";
    case "expirada":
      return "Expirada";
    case "atrasada":
      return "Atrasada";
    case "extornada":
      return "Extornada";
    case "a_iniciar":
      return "A iniciar";
    case "adimplente":
      return "Adimplente";

    default:
      // Se não encontrar uma tradução, retorna o próprio nome de entrada, mas com a primeira letra maiúscula.
      return statusNomeEnum.charAt(0).toUpperCase() + statusNomeEnum.slice(1);
  }
}
