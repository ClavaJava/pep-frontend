import { useState, useEffect } from "react";
import { api } from "../services/api";

const SETORES = ["UTI", "ENFERMARIA"];

export default function Internados() {
  const [tab, setTab] = useState("ativos");
  const [internados, setInternados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modais
  const [modalAlta, setModalAlta] = useState(null);
  const [modalTransf, setModalTransf] = useState(null);
  const [modalDetalhe, setModalDetalhe] = useState(null);
  const [novoSetor, setNovoSetor] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Histórico
  const [cpfHistorico, setCpfHistorico] = useState("");
  const [historico, setHistorico] = useState(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [historicoError, setHistoricoError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.internacoes.listarAtivas();
      setInternados(data.content || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ALTA
  const darAlta = async () => {
    setSaving(true); setActionError(null);
    try {
      await api.internacoes.darAlta(modalAlta.id);
      setModalAlta(null);
      load();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // TRANSFERÊNCIA
  const transferir = async () => {
    if (!novoSetor) { setActionError("Selecione o setor destino."); return; }
    setSaving(true); setActionError(null);
    try {
      await api.internacoes.transferir(modalTransf.id, novoSetor);
      setModalTransf(null);
      setNovoSetor("");
      load();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // HISTÓRICO
  const buscarHistorico = async () => {
    setLoadingHistorico(true); setHistoricoError(null); setHistorico(null);
    try {
      const cpfNum = cpfHistorico.replace(/\D/g, "");
      const paciente = await api.pacientes.buscarPorCpf(cpfNum);
      const [hist, ] = await Promise.all([
        api.internacoes.historico(paciente.id),
      ]);
      const internacoesCom = await Promise.all(
        hist.map(async (intern) => {
          const movs = await api.internacoes.movimentacoes(intern.id).catch(() => []);
          return { ...intern, movimentacoes: movs };
        })
      );
      setHistorico({ paciente, internacoes: internacoesCom });
    } catch (e) {
      setHistoricoError(e.message);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const formatCpf = (v) =>
    v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);

  return (
    <div>
      <div className="tab-bar">
        <button className={`tab-btn ${tab === "ativos" ? "active" : ""}`} onClick={() => setTab("ativos")}>
          Internados Ativos
        </button>
        <button className={`tab-btn ${tab === "historico" ? "active" : ""}`} onClick={() => setTab("historico")}>
          Histórico por Paciente
        </button>
      </div>

      {/* ===== ATIVOS ===== */}
      {tab === "ativos" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pacientes internados</span>
            <button className="btn btn-outline btn-sm" onClick={load}>↻ Atualizar</button>
          </div>
          {loading ? (
            <div className="loading-center"><span className="spinner" /> Carregando...</div>
          ) : error ? (
            <div className="card-body"><div className="alert alert-error">⚠ {error}</div></div>
          ) : internados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛏</div>
              <p>Nenhum paciente internado no momento.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Paciente</th>
                    <th>Setor</th>
                    <th>Data Entrada</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {internados.map(i => (
                    <tr key={i.id}>
                      <td className="mono text-muted">{i.id}</td>
                      <td className="fw-600">{i.nomePaciente}</td>
                      <td><span className={`badge ${i.setor === "UTI" ? "badge-red" : "badge-blue"}`}>{i.setor}</span></td>
                      <td>{i.dataEntrada}</td>
                      <td><span className="badge badge-green">{i.status}</span></td>
                      <td>
                        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => { setModalDetalhe(i); setActionError(null); }}>
                            📋 Prontuário
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => { setModalTransf(i); setNovoSetor(""); setActionError(null); }}>
                            🔄 Transferir
                          </button>
                          <button className="btn btn-success btn-sm" onClick={() => { setModalAlta(i); setActionError(null); }}>
                            Alta
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== HISTÓRICO ===== */}
      {tab === "historico" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">Buscar histórico do paciente</span></div>
            <div className="card-body">
              {historicoError && <div className="alert alert-error">⚠ {historicoError}</div>}
              <div className="flex gap-3 items-center">
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <input
                    value={cpfHistorico}
                    onChange={e => setCpfHistorico(formatCpf(e.target.value))}
                    placeholder="CPF do paciente"
                    maxLength={14}
                    onKeyDown={e => e.key === "Enter" && buscarHistorico()}
                  />
                </div>
                <button className="btn btn-primary" onClick={buscarHistorico} disabled={loadingHistorico}>
                  {loadingHistorico ? <><span className="spinner" /> Buscando...</> : "Buscar"}
                </button>
              </div>
            </div>
          </div>

          {historico && (
            <div>
              <div style={{
                background: "var(--primary-light)", border: "1px solid #c0d4ff",
                borderRadius: 6, padding: "12px 16px", marginBottom: 16
              }}>
                <div style={{ fontWeight: 600 }}>{historico.paciente.nome}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                  CPF: {historico.paciente.cpf} · Sexo: {historico.paciente.sexo}
                </div>
              </div>

              {historico.internacoes.length === 0 ? (
                <div className="card">
                  <div className="empty-state"><p>Nenhuma internação encontrada.</p></div>
                </div>
              ) : (
                historico.internacoes.map(intern => (
                  <div className="card" key={intern.id} style={{ marginBottom: 12 }}>
                    <div className="card-header">
                      <div className="flex gap-3 items-center">
                        <span className="card-title">Internação #{intern.id}</span>
                        <span className={`badge ${intern.status === "INTERNADO" ? "badge-green" : "badge-gray"}`}>
                          {intern.status}
                        </span>
                      </div>
                      <span className="text-muted text-sm">
                        {intern.dataEntrada} {intern.dataAlta ? `→ ${intern.dataAlta}` : "(em curso)"}
                      </span>
                    </div>
                    <div className="card-body">
                      <div style={{ marginBottom: intern.movimentacoes?.length > 0 ? 12 : 0 }}>
                        <span style={{ fontSize: 12, color: "var(--text2)" }}>Setor atual: </span>
                        <span className={`badge ${intern.setor === "UTI" ? "badge-red" : "badge-blue"}`}>{intern.setor}</span>
                      </div>

                      {intern.movimentacoes?.length > 0 && (
                        <div>
                          <div className="section-title" style={{ marginBottom: 8 }}>Movimentações</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {intern.movimentacoes.map((m, idx) => (
                              <div key={idx} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                fontSize: 13, padding: "6px 10px",
                                background: "var(--surface2)", borderRadius: 4
                              }}>
                                <span className={`badge ${m.setorOrigem === "UTI" ? "badge-red" : "badge-blue"}`}>{m.setorOrigem}</span>
                                <span>→</span>
                                <span className={`badge ${m.setorDestino === "UTI" ? "badge-red" : "badge-blue"}`}>{m.setorDestino}</span>
                                <span className="text-muted mono" style={{ marginLeft: "auto", fontSize: 11 }}>
                                  {new Date(m.dataHora).toLocaleString("pt-BR")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL ALTA ===== */}
      {modalAlta && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Confirmar Alta</span>
              <button className="modal-close" onClick={() => setModalAlta(null)}>×</button>
            </div>
            <div className="modal-body">
              {actionError && <div className="alert alert-error">⚠ {actionError}</div>}
              <p>Dar alta para <strong>{modalAlta.nomePaciente}</strong>?</p>
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                O leito será liberado automaticamente.
              </p>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModalAlta(null)}>Cancelar</button>
                <button className="btn btn-success" onClick={darAlta} disabled={saving}>
                  {saving ? <><span className="spinner" /> Processando...</> : "Confirmar Alta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL TRANSFERÊNCIA ===== */}
      {modalTransf && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Transferir Paciente</span>
              <button className="modal-close" onClick={() => setModalTransf(null)}>×</button>
            </div>
            <div className="modal-body">
              {actionError && <div className="alert alert-error">⚠ {actionError}</div>}
              <p style={{ marginBottom: 16 }}>
                Transferir <strong>{modalTransf.nomePaciente}</strong> ({modalTransf.setor}) para:
              </p>
              <div className="form-group">
                <label>Setor Destino</label>
                <select value={novoSetor} onChange={e => setNovoSetor(e.target.value)}>
                  <option value="">Selecione</option>
                  {SETORES.filter(s => s !== modalTransf.setor).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModalTransf(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={transferir} disabled={saving}>
                  {saving ? <><span className="spinner" /> Transferindo...</> : "Transferir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL PRONTUÁRIO ===== */}
      {modalDetalhe && (
        <ProntuarioModal
          internacao={modalDetalhe}
          onClose={() => setModalDetalhe(null)}
        />
      )}
    </div>
  );
}

// ==============================
// COMPONENTE PRONTUÁRIO
// ==============================
function ProntuarioModal({ internacao, onClose }) {
  const [tab, setTab] = useState("prescricoes");
  const [prescricoes, setPrescricoes] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formPrescricao, setFormPrescricao] = useState({ medicamento: "", dose: "", frequencia: "", observacoes: "" });
  const [formRelatorio, setFormRelatorio] = useState({ tipo: "MEDICO", descricao: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        api.prescricoes.listar(internacao.id).catch(() => []),
        api.relatorios.listar(internacao.id).catch(() => []),
      ]);
      setPrescricoes(p);
      setRelatorios(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const salvarPrescricao = async () => {
    if (!formPrescricao.medicamento || !formPrescricao.dose) {
      setSaveError("Preencha medicamento e dose."); return;
    }
    setSaving(true); setSaveError(null);
    try {
      await api.prescricoes.criar(internacao.id, formPrescricao);
      setFormPrescricao({ medicamento: "", dose: "", frequencia: "", observacoes: "" });
      loadAll();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const salvarRelatorio = async () => {
    if (!formRelatorio.descricao) { setSaveError("Preencha a descrição."); return; }
    setSaving(true); setSaveError(null);
    try {
      await api.relatorios.criar(internacao.id, formRelatorio);
      setFormRelatorio({ tipo: "MEDICO", descricao: "" });
      loadAll();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">Prontuário — {internacao.nomePaciente}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              Internação #{internacao.id} · {internacao.setor} · desde {internacao.dataEntrada}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="tab-bar">
            <button className={`tab-btn ${tab === "prescricoes" ? "active" : ""}`} onClick={() => { setTab("prescricoes"); setSaveError(null); }}>
              💊 Prescrições
            </button>
            <button className={`tab-btn ${tab === "relatorios" ? "active" : ""}`} onClick={() => { setTab("relatorios"); setSaveError(null); }}>
              📝 Relatórios
            </button>
          </div>

          {loading ? (
            <div className="loading-center"><span className="spinner" /></div>
          ) : error ? (
            <div className="alert alert-error">⚠ {error}</div>
          ) : (
            <>
              {/* ===== PRESCRIÇÕES ===== */}
              {tab === "prescricoes" && (
                <div>
                  <div className="section-title">Nova Prescrição</div>
                  {saveError && <div className="alert alert-error">⚠ {saveError}</div>}
                  <div className="form-grid" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label>Medicamento *</label>
                      <input value={formPrescricao.medicamento} onChange={e => setFormPrescricao({ ...formPrescricao, medicamento: e.target.value })} placeholder="Ex: Dipirona" />
                    </div>
                    <div className="form-group">
                      <label>Dose *</label>
                      <input value={formPrescricao.dose} onChange={e => setFormPrescricao({ ...formPrescricao, dose: e.target.value })} placeholder="Ex: 500mg" />
                    </div>
                    <div className="form-group">
                      <label>Frequência</label>
                      <input value={formPrescricao.frequencia} onChange={e => setFormPrescricao({ ...formPrescricao, frequencia: e.target.value })} placeholder="Ex: 8 em 8h" />
                    </div>
                    <div className="form-group full">
                      <label>Observações</label>
                      <textarea value={formPrescricao.observacoes} onChange={e => setFormPrescricao({ ...formPrescricao, observacoes: e.target.value })} placeholder="Observações adicionais..." rows={2} />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={salvarPrescricao} disabled={saving}>
                    {saving ? <><span className="spinner" /> Salvando...</> : "＋ Adicionar Prescrição"}
                  </button>

                  {prescricoes.length > 0 && (
                    <>
                      <div className="section-title" style={{ marginTop: 24 }}>Prescrições Anteriores</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {prescricoes.map((p, i) => (
                          <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <span className="fw-600">{p.medicamento}</span>
                                <span style={{ color: "var(--text2)", margin: "0 8px" }}>·</span>
                                <span>{p.dose}</span>
                                {p.frequencia && <span className="text-muted" style={{ marginLeft: 8 }}>({p.frequencia})</span>}
                              </div>
                              <span className="mono text-muted text-sm">{p.dataHora ? new Date(p.dataHora).toLocaleString("pt-BR") : ""}</span>
                            </div>
                            {p.observacoes && <div className="text-muted text-sm" style={{ marginTop: 4 }}>{p.observacoes}</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {prescricoes.length === 0 && (
                    <div className="empty-state" style={{ padding: "24px 0" }}>
                      <p>Nenhuma prescrição registrada.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== RELATÓRIOS ===== */}
              {tab === "relatorios" && (
                <div>
                  <div className="section-title">Novo Relatório</div>
                  {saveError && <div className="alert alert-error">⚠ {saveError}</div>}
                  <div className="form-grid" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label>Tipo *</label>
                      <select value={formRelatorio.tipo} onChange={e => setFormRelatorio({ ...formRelatorio, tipo: e.target.value })}>
                        <option value="MEDICO">Relatório Médico</option>
                        <option value="ENFERMAGEM">Relatório de Enfermagem</option>
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Descrição *</label>
                      <textarea
                        value={formRelatorio.descricao}
                        onChange={e => setFormRelatorio({ ...formRelatorio, descricao: e.target.value })}
                        placeholder="Descreva a evolução do paciente..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={salvarRelatorio} disabled={saving}>
                    {saving ? <><span className="spinner" /> Salvando...</> : "＋ Adicionar Relatório"}
                  </button>

                  {relatorios.length > 0 && (
                    <>
                      <div className="section-title" style={{ marginTop: 24 }}>Relatórios Anteriores</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {relatorios.map((r, i) => (
                          <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span className={`badge ${r.tipo === "MEDICO" ? "badge-blue" : "badge-green"}`}>
                                {r.tipo === "MEDICO" ? "Médico" : "Enfermagem"}
                              </span>
                              <span className="mono text-muted text-sm">{r.dataHora ? new Date(r.dataHora).toLocaleString("pt-BR") : ""}</span>
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.descricao}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {relatorios.length === 0 && (
                    <div className="empty-state" style={{ padding: "24px 0" }}>
                      <p>Nenhum relatório registrado.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
