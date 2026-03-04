import { useState } from "react";
import { api } from "../services/api";

export default function Relatorios() {
  const [cpf, setCpf] = useState("");
  const [paciente, setPaciente] = useState(null);
  const [internacoes, setInternacoes] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [prescricoes, setPrescricoes] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("prescricoes");

  const formatCpf = (v) =>
    v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);

  const buscar = async () => {
    setLoading(true); setError(null); setInternacoes([]); setPaciente(null); setSelecionada(null);
    try {
      const p = await api.pacientes.buscarPorCpf(cpf.replace(/\D/g, ""));
      const hist = await api.internacoes.historico(p.id);
      setPaciente(p);
      setInternacoes(hist);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selecionarInternacao = async (intern) => {
    setSelecionada(intern);
    setLoadingDetalhe(true);
    try {
      const [p, r] = await Promise.all([
        api.prescricoes.listar(intern.id).catch(() => []),
        api.relatorios.listar(intern.id).catch(() => []),
      ]);
      setPrescricoes(p);
      setRelatorios(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingDetalhe(false);
    }
  };

  return (
    <div>
      {/* Busca */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Consultar Relatórios e Prescrições</span></div>
        <div className="card-body">
          {error && <div className="alert alert-error">⚠ {error}</div>}
          <div className="flex gap-3 items-center">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <input
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="CPF do paciente"
                maxLength={14}
                onKeyDown={e => e.key === "Enter" && buscar()}
              />
            </div>
            <button className="btn btn-primary" onClick={buscar} disabled={loading}>
              {loading ? <><span className="spinner" /> Buscando...</> : "Buscar"}
            </button>
          </div>
        </div>
      </div>

      {paciente && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>
          {/* Lista de internações */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{paciente.nome}</div>
                <div className="text-muted text-sm mono">{paciente.cpf}</div>
              </div>
            </div>
            {internacoes.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 16px" }}>
                <p>Sem internações.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {internacoes.map(i => (
                  <button
                    key={i.id}
                    onClick={() => selecionarInternacao(i)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "10px 16px",
                      borderBottom: "1px solid var(--border)",
                      background: selecionada?.id === i.id ? "var(--primary-light)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: selecionada?.id === i.id ? "var(--primary)" : "var(--text)" }}>
                        #{i.id}
                      </span>
                      <span className={`badge ${i.status === "INTERNADO" ? "badge-green" : "badge-gray"}`} style={{ fontSize: 10 }}>
                        {i.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                      {i.setor} · {i.dataEntrada}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalhe */}
          <div className="card">
            {!selecionada ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>Selecione uma internação para ver os registros.</p>
              </div>
            ) : loadingDetalhe ? (
              <div className="loading-center"><span className="spinner" /> Carregando...</div>
            ) : (
              <>
                <div className="card-header">
                  <div>
                    <div className="card-title">Internação #{selecionada.id}</div>
                    <div className="text-muted text-sm">
                      {selecionada.setor} · {selecionada.dataEntrada}
                      {selecionada.dataAlta ? ` → ${selecionada.dataAlta}` : " (em curso)"}
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="tab-bar">
                    <button className={`tab-btn ${tab === "prescricoes" ? "active" : ""}`} onClick={() => setTab("prescricoes")}>
                      💊 Prescrições ({prescricoes.length})
                    </button>
                    <button className={`tab-btn ${tab === "relatorios" ? "active" : ""}`} onClick={() => setTab("relatorios")}>
                      📝 Relatórios ({relatorios.length})
                    </button>
                  </div>

                  {tab === "prescricoes" && (
                    prescricoes.length === 0 ? (
                      <div className="empty-state" style={{ padding: "24px 0" }}><p>Nenhuma prescrição.</p></div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {prescricoes.map((p, i) => (
                          <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <div>
                                <span className="fw-600">{p.medicamento}</span>
                                <span style={{ color: "var(--text2)", margin: "0 6px" }}>·</span>
                                <span>{p.dose}</span>
                                {p.frequencia && <span className="text-muted" style={{ marginLeft: 6 }}>({p.frequencia})</span>}
                              </div>
                              <span className="mono text-muted text-sm">{p.dataHora ? new Date(p.dataHora).toLocaleString("pt-BR") : ""}</span>
                            </div>
                            {p.observacoes && <div className="text-muted text-sm" style={{ marginTop: 4 }}>{p.observacoes}</div>}
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {tab === "relatorios" && (
                    relatorios.length === 0 ? (
                      <div className="empty-state" style={{ padding: "24px 0" }}><p>Nenhum relatório.</p></div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {relatorios.map((r, i) => (
                          <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                              <span className={`badge ${r.tipo === "MEDICO" ? "badge-blue" : "badge-green"}`}>
                                {r.tipo === "MEDICO" ? "Médico" : "Enfermagem"}
                              </span>
                              <span className="mono text-muted text-sm">{r.dataHora ? new Date(r.dataHora).toLocaleString("pt-BR") : ""}</span>
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.descricao}</div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
