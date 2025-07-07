type SearchCpfResponse = {
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
    if (!data || !data.data.id) {
      console.log("Dados obtidos:", data.data.mensagem);
      return data.data;
    }
    return { ...data.data, success: true };
  } catch (error) {
    console.error("Erro de requisição:", error);
  }
}
