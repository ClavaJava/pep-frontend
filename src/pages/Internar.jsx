import { useState } from "react";
import { api } from "../services/api";

const SETORES = ["UTI", "ENFERMARIA"];

export default function Internar() {
  const [step, setStep] = useState(1);
  const [cpf, setCpf] = useState("");
  const [paciente, setPaciente] = useState(null);
  const [form, setForm] = useState({ setor: "", numeroLeito: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [leitos, setLeitos] = useState([]);
  const [leitosLoading, setLeitosLoading] = useState(false);

  const formatCpf = (v) =>
    v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);

  const buscarPaciente = async () => {
    if (!cpf) return;
    setLoading(true); setError(null);
    try {
      const p = await api.pacientes.buscarPorCpf(cpf.replace(/\D/g, ""));
      setPaciente(p);
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetorChange = async (setor) => {
    setForm({ setor, numeroLeito: "" });
    if (!setor) { setLeitos([]); return; }
    setLeitosLoading(true);
    try {
      const data = await api.leitos.disponiveis(setor);
      setLeitos(data);
    } catch {
      setLeitos([]);
    } finally {
      setLeitosLoading(false);
    }
  };

  const confirmarInternacao = async () => {
    if (!form.setor || !form.numeroLeito) {
      setError("Selecione o setor e o leito.");
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await api.internacoes.internar(paciente.id, {
        setor: form.setor,
        numeroLeito: parseInt(form.numeroLeito),
      });
      setResultado(res);
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reiniciar = () => {
    setStep(1); setCpf(""); setPaciente(null);
    setForm({ setor: "", numeroLeito: "" });
    setError(null); setResultado(null); setLeitos([]);
  };

  const calcIdade = (nascimento) => {
    if (!nascimento) return "-";
    return Math.floor((Date.now() - new Date(nascimento)) / (365.25 * 24 * 60 * 60 * 1000)) + " anos";
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 0 }}>
        {[["1", "Identificar Paciente"], ["2", "Dados da Internacao"], ["3", "Confirmacao"]].map(([n, label], i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: step > i ? "var(--primary)" : step === i + 1 ? "var(--primary)" : "var(--border)",
                color: step >= i + 1 ? "white" : "var(--text3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 600, fontSize: 13, transition: "all 0.2s"
              }}>{step > i + 1 ? "✓" : n}</div>
              <span style={{ fontSize: 11, color: step === i + 1 ? "var(--primary)" : "var(--text3)", marginTop: 4, whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 2, margin: "0 8px", marginBottom: 20,
                background: step > i + 1 ? "var(--primary)" : "var(--border)",
                transition: "background 0.2s"
              }} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Buscar Paciente pelo CPF</span>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>CPF do Paciente</label>
              <input
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                onKeyDown={e => e.key === "Enter" && buscarPaciente()}
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={buscarPaciente}
              disabled={loading || cpf.replace(/\D/g, "").length < 11}
            >
              {loading ? <><span className="spinner" /> Buscando...</> : "Buscar Paciente"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && paciente && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Dados da Internacao</span>
          </div>
          <div className="card-body">
            <div style={{
              background: "var(--primary-light)", border: "1px solid #c0d4ff",
              borderRadius: 6, padding: "12px 16px", marginBottom: 20
            }}>
              <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                Paciente Identificado
              </div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{paciente.nome}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 12, color: "var(--text2)" }}>
                <span>CPF: <span className="mono">{paciente.cpf}</span></span>
                <span>Sexo: {paciente.sexo}</span>
                <span>Idade: {calcIdade(paciente.dataNascimento)}</span>
              </div>
            </div>

            {error && <div className="alert alert-error">⚠ {error}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label>Setor *</label>
                <select value={form.setor} onChange={e => handleSetorChange(e.target.value)}>
                  <option value="">Selecione o setor</option>
                  {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Leito *</label>
                <select
                  value={form.numeroLeito}
                  onChange={e => setForm({ ...form, numeroLeito: e.target.value })}
                  disabled={!form.setor || leitosLoading}
                >
                  <option value="">
                    {leitosLoading ? "Carregando..." : !form.setor ? "Selecione o setor primeiro" : leitos.length === 0 ? "Nenhum leito disponivel" : "Selecione o leito"}
                  </option>
                  {leitos.map(l => (
                    <option key={l.id} value={l.numero}>
                      Leito {l.numero}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-outline" onClick={reiniciar}>← Voltar</button>
              <button className="btn btn-primary" onClick={confirmarInternacao} disabled={loading}>
                {loading ? <><span className="spinner" /> Internando...</> : "Confirmar Internacao"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && resultado && (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Internacao realizada!</div>
            <div style={{ color: "var(--text2)", marginBottom: 24 }}>
              <strong>{resultado.nomePaciente}</strong> foi internado com sucesso.
            </div>
            <div style={{
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "12px 16px", marginBottom: 24, textAlign: "left",
              display: "inline-block", minWidth: 280
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: 13 }}>
                <span className="text-muted">ID Internacao</span><span className="mono fw-600">#{resultado.id}</span>
                <span className="text-muted">Setor</span><span className="fw-600">{resultado.setor}</span>
                <span className="text-muted">Data</span><span>{resultado.dataEntrada}</span>
                <span className="text-muted">Status</span>
                <span><span className="badge badge-green">{resultado.status}</span></span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-outline" onClick={reiniciar}>Nova Internacao</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}