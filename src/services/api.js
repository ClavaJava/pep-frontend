const BASE = "http://localhost:8080";

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Erro na requisição");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// PACIENTES
export const api = {
  pacientes: {
    listar: () => req("GET", "/pacientes"),
    buscarPorCpf: (cpf) => req("GET", `/pacientes/cpf/${cpf}`),
    cadastrar: (dto) => req("POST", "/pacientes", dto),
    atualizar: (id, dto) => req("PUT", `/pacientes/${id}`, dto),
    deletar: (id) => req("DELETE", `/pacientes/${id}`),
    buscarPorNome: (nome) => req("GET", `/pacientes/buscar?nome=${encodeURIComponent(nome)}`),
  },
  internacoes: {
    internar: (pacienteId, dto) => req("POST", `/internacoes/${pacienteId}`, dto),
    listarAtivas: (page = 0, size = 20) => req("GET", `/internacoes/ativas?page=${page}&size=${size}`),
    darAlta: (id) => req("PUT", `/internacoes/${id}/alta`),
    transferir: (id, novoSetor) => req("PUT", `/internacoes/${id}/transferir?novoSetor=${novoSetor}`),
    historico: (pacienteId) => req("GET", `/internacoes/paciente/${pacienteId}`),
    movimentacoes: (internacaoId) => req("GET", `/internacoes/${internacaoId}/movimentacoes`),
  },
  leitos: {
    dashboard: () => req("GET", "/leitos/dashboard"),
    disponiveis: (setor) => req("GET", `/leitos/disponiveis?setor=${setor}`),
},
  prescricoes: {
    listar: (internacaoId) => req("GET", `/prescricoes/internacao/${internacaoId}`),
    criar: (internacaoId, dto) => req("POST", `/prescricoes/internacao/${internacaoId}`, dto),
  },
  relatorios: {
    listar: (internacaoId) => req("GET", `/relatorios/internacao/${internacaoId}`),
    criar: (internacaoId, dto) => req("POST", `/relatorios/internacao/${internacaoId}`, dto),
  },
};
