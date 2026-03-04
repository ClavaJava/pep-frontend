import { useState, useEffect } from "react";
import { api } from "../services/api";

const EMPTY_FORM = { nome: "", cpf: "", sexo: "", dataNascimento: "" };

function formatCpf(v) {
  return v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | 'new' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.pacientes.listar();
      setPacientes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setFormError(null); setModal("form"); };
  const openEdit = (p) => {
    setForm({ nome: p.nome, cpf: p.cpf, sexo: p.sexo, dataNascimento: p.dataNascimento });
    setEditId(p.id);
    setFormError(null);
    setModal("form");
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async () => {
    if (!form.nome || !form.cpf || !form.sexo || !form.dataNascimento) {
      setFormError("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true); setFormError(null);
    try {
      if (editId) {
        await api.pacientes.atualizar(editId, form);
      } else {
        await api.pacientes.cadastrar(form);
      }
      closeModal();
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este paciente?")) return;
    try {
      await api.pacientes.deletar(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const filtered = pacientes.filter(p =>
    p.nome?.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf?.includes(search.replace(/\D/g, ""))
  );

  const calcIdade = (nascimento) => {
    if (!nascimento) return "-";
    const diff = Date.now() - new Date(nascimento).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)) + " anos";
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Pacientes cadastrados</span>
          <div className="flex gap-2">
            <input
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
            <button className="btn btn-primary" onClick={openNew}>+ Novo Paciente</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner" /> Carregando...</div>
        ) : error ? (
          <div className="card-body"><div className="alert alert-error">⚠ {error}</div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <p>{search ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Sexo</th>
                  <th>Idade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="mono text-muted">{p.id}</td>
                    <td className="fw-600">{p.nome}</td>
                    <td className="mono">{p.cpf}</td>
                    <td>
                      <span className={`badge ${p.sexo === "MASCULINO" ? "badge-blue" : "badge-yellow"}`}>
                        {p.sexo === "MASCULINO" ? "M" : "F"}
                      </span>
                    </td>
                    <td>{calcIdade(p.dataNascimento)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === "form" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editId ? "Editar Paciente" : "Novo Paciente"}</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">⚠ {formError}</div>}
              <div className="form-grid">
                <div className="form-group full">
                  <label>Nome Completo *</label>
                  <input
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome do paciente"
                  />
                </div>
                <div className="form-group">
                  <label>CPF *</label>
                  <input
                    value={form.cpf}
                    onChange={e => setForm({ ...form, cpf: formatCpf(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="form-group">
                  <label>Sexo *</label>
                  <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })}>
                    <option value="">Selecione</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de Nascimento *</label>
                  <input
                    type="date"
                    value={form.dataNascimento}
                    onChange={e => setForm({ ...form, dataNascimento: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? <><span className="spinner" /> Salvando...</> : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
