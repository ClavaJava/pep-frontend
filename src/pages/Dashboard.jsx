import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const d = await api.leitos.dashboard();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="loading-center">
      <span className="spinner" /> Carregando dashboard...
    </div>
  );

  if (error) return (
    <div className="alert alert-error">⚠ {error}</div>
  );

  const setores = data ? Object.entries(data) : [];
  const totalLeitos = setores.reduce((a, [, v]) => a + (v.total || 0), 0);
  const totalOcupados = setores.reduce((a, [, v]) => a + (v.ocupados || 0), 0);
  const totalLivres = totalLeitos - totalOcupados;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total de Leitos</div>
          <div className="stat-value">{totalLeitos}</div>
          <div className="stat-sub">capacidade total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ocupados</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>{totalOcupados}</div>
          <div className="stat-sub">{totalLeitos > 0 ? Math.round((totalOcupados / totalLeitos) * 100) : 0}% de ocupação</div>
          <div className="stat-bar">
            <div
              className={`stat-bar-fill ${totalOcupados / totalLeitos > 0.8 ? "danger" : totalOcupados / totalLeitos > 0.6 ? "warning" : ""}`}
              style={{ width: `${totalLeitos > 0 ? (totalOcupados / totalLeitos) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Disponíveis</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>{totalLivres}</div>
          <div className="stat-sub">leitos livres</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {setores.map(([setor, info]) => {
          const pct = info.total > 0 ? Math.round((info.ocupados / info.total) * 100) : 0;
          const livres = info.total - info.ocupados;
          return (
            <div className="card" key={setor}>
              <div className="card-header">
                <span className="card-title">{setor}</span>
                <span className={`badge ${pct >= 90 ? "badge-red" : pct >= 70 ? "badge-yellow" : "badge-green"}`}>
                  {pct}% ocupado
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div className="stat-label">Ocupados</div>
                    <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "IBM Plex Mono", color: "var(--danger)" }}>
                      {info.ocupados}
                    </div>
                  </div>
                  <div>
                    <div className="stat-label">Livres</div>
                    <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "IBM Plex Mono", color: "var(--success)" }}>
                      {livres}
                    </div>
                  </div>
                  <div>
                    <div className="stat-label">Total</div>
                    <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "IBM Plex Mono" }}>
                      {info.total}
                    </div>
                  </div>
                </div>

                {/* Grid visual de leitos */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {Array.from({ length: info.total }).map((_, i) => (
                    <div
                      key={i}
                      title={`Leito ${i + 1}`}
                      style={{
                        width: 20, height: 20,
                        borderRadius: 3,
                        background: i < info.ocupados ? "var(--danger)" : "var(--success-light)",
                        border: `1px solid ${i < info.ocupados ? "#c92a2a" : "#b3e8d8"}`,
                        cursor: "default",
                        fontSize: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: i < info.ocupados ? "white" : "var(--success)"
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 11, color: "var(--text3)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, background: "var(--danger)", borderRadius: 2, display: "inline-block" }} />
                    Ocupado
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, background: "var(--success-light)", border: "1px solid var(--success)", borderRadius: 2, display: "inline-block" }} />
                    Livre
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Atualizar</button>
      </div>
    </div>
  );
}
