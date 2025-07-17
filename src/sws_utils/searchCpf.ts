type SearchCpfResponse = {
  parcelas: Array<{
    id: number;
    valor: number;
    vencimento: string;
  }>;
  situacao_checkin: string;
  id: number;
  nome: string;
  cpf: string;
  telefone_celular: string;
  data_nascimento: string;
  adesao: {
    id: number;
    data_inicio: string;
    data_final: string;
    status: {
      id: number;
      nome: string;
    };
    plano: {
      id: number;
      nome: string;
    };
    dependentes: any[];
  };
  success: true;
};

type SearchCpfErrorResponse = {
  success: false;
  mensagem: string;
};

type SearchCpfResult = SearchCpfResponse | SearchCpfErrorResponse;

export async function searchCpf(token, cpf): Promise<SearchCpfResult> {
  try {
    cpf = cpf.replace(/\D/g, "");
    const response = await fetch(
      `https://apiteste.sociofortaleza.com.br/api/v1/pessoas/${cpf}/search_cpf`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // if (!response.success) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }
    const data = await response.json();

    if (data.data.id) {
      const idAdesao = data.data.adesao.id;
      const response2 = await fetch(
        `https://apiteste.sociofortaleza.com.br/api/v1/adesoes/${idAdesao}/parcelas?cpf=${cpf}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const parcelas = await response2.json();
      const dataWithParcelas = {
        success: true,
        situacao_checkin: parcelas.data.stituacao_para_checkin,
        ...data.data,
        parcelas: parcelas.data.parcelas,
      };

      return dataWithParcelas;
    } else {
      console.log("CPF não encontrado ou inválido:", data.data.mensagem);
      return {
        success: false,
        mensagem: data.data.mensagem || "CPF não encontrado ou inválido",
      } as SearchCpfErrorResponse;
    }
    return { ...data.data, success: true };
  } catch (error) {
    console.error("Erro de requisição:", error);
  }
}
