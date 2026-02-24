import React, { useEffect, useMemo, useRef, useState } from "react";
import { createUnit, listUnits } from "./api/units";
import { createFloor, listFloors } from "./api/floors";
import { createArea, deleteArea, listAreas, patchArea } from "./api/areas";
import {
  createEquipment,
  deleteEquipment,
  listEquipments,
  searchEquipments,
  updateEquipment,
} from "./api/equipments";

function withId(doc) {
  if (!doc) return doc;
  if (doc.id) return doc;
  if (doc._id) return { ...doc, id: doc._id };
  return doc;
}

function normalizeList(docs) {
  return Array.isArray(docs) ? docs.map(withId) : [];
}

export default function AppNew() {
  const [units, setUnits] = useState([]);
  const [floors, setFloors] = useState([]);
  const [areas, setAreas] = useState([]);

  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  const [equipments, setEquipments] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("usuario");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [loading, setLoading] = useState({
    units: false,
    floors: false,
    areas: false,
    equipments: false,
  });
  const [errorMsg, setErrorMsg] = useState("");

  const [equipmentDraft, setEquipmentDraft] = useState({
    tipo: "notebook",
    proprietario: "",
    nomeMaquina: "",
    usuarioLogado: "",
    anydesk: "",
    kaspersky: "",
    status: "ativo",
    armazenamentoLivre: "",
    observacoes: "",
  });

  const dragRef = useRef({
    active: false,
    areaId: "",
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    originWidth: 0,
    originHeight: 0,
    mode: "move", // "move" | "resize"
  });

  async function safeRun(fn) {
    setErrorMsg("");
    try {
      return await fn();
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || "Erro desconhecido";
      setErrorMsg(message);
      throw error;
    }
  }

  async function loadUnits({ preferUnitId } = {}) {
    setLoading((p) => ({ ...p, units: true }));
    try {
      const data = await safeRun(() => listUnits());
      const list = normalizeList(data);
      setUnits(list);
      const nextId = preferUnitId || list[0]?.id || "";
      setSelectedUnitId(nextId);
      return list;
    } finally {
      setLoading((p) => ({ ...p, units: false }));
    }
  }

  async function loadFloors({ unitId, preferFloorId } = {}) {
    if (!unitId) {
      setFloors([]);
      setSelectedFloorId("");
      return [];
    }

    setLoading((p) => ({ ...p, floors: true }));
    try {
      const data = await safeRun(() => listFloors({ unitId }));
      const list = normalizeList(data);
      setFloors(list);
      const nextId = preferFloorId || list[0]?.id || "";
      setSelectedFloorId(nextId);
      return list;
    } finally {
      setLoading((p) => ({ ...p, floors: false }));
    }
  }

  async function loadAreas({ unitId, floorId } = {}) {
    if (!unitId || !floorId) {
      setAreas([]);
      return [];
    }

    setLoading((p) => ({ ...p, areas: true }));
    try {
      const data = await safeRun(() => listAreas({ unitId, floorId }));
      const list = normalizeList(data);
      setAreas(list);
      return list;
    } finally {
      setLoading((p) => ({ ...p, areas: false }));
    }
  }

  async function loadEquipments({ areaId } = {}) {
    if (!areaId) {
      setEquipments([]);
      return [];
    }

    setLoading((p) => ({ ...p, equipments: true }));
    try {
      const data = await safeRun(() => listEquipments({ areaId }));
      const list = normalizeList(data);
      setEquipments(list);
      return list;
    } finally {
      setLoading((p) => ({ ...p, equipments: false }));
    }
  }

  useEffect(() => {
    loadUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUnitId) {
      setFloors([]);
      setAreas([]);
      setSelectedFloorId("");
      return;
    }
    loadFloors({ unitId: selectedUnitId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnitId]);

  useEffect(() => {
    setSelectedAreaId("");
    setIsAreaModalOpen(false);
    setEditingArea(null);
    setEquipments([]);
    loadAreas({ unitId: selectedUnitId, floorId: selectedFloorId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloorId, selectedUnitId]);

  const currentUnit = useMemo(
    () => units.find((u) => u.id === selectedUnitId) ?? null,
    [units, selectedUnitId],
  );
  const currentFloor = useMemo(
    () => floors.find((f) => f.id === selectedFloorId) ?? null,
    [floors, selectedFloorId],
  );

  const handleSearchEquipments = async (event) => {
    if (event) {
      event.preventDefault();
    }
    const term = searchTerm.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const data = await safeRun(() =>
        searchEquipments({
          q: term,
          by: searchBy,
        }),
      );
      const list = normalizeList(data);
      setSearchResults(list);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOpenAreaModal = async (area) => {
    const a = withId(area);
    setEditingArea(a);
    setSelectedAreaId(a.id);
    setIsAreaModalOpen(true);
    setEditingEquipmentId(null);
    setEquipmentDraft({
      tipo: "notebook",
      proprietario: "",
      nomeMaquina: "",
      usuarioLogado: "",
      anydesk: "",
      kaspersky: "",
      status: "ativo",
      armazenamentoLivre: "",
      observacoes: "",
    });
    await loadEquipments({ areaId: a.id });
  };

  const handleAddUnit = async () => {
    const name = window.prompt("Nome da unidade:");
    if (!name?.trim()) return;
    const created = await safeRun(() => createUnit({ name: name.trim() }));
    await loadUnits({ preferUnitId: withId(created).id });
  };

  const handleAddFloor = async () => {
    if (!selectedUnitId) return;
    const name = window.prompt("Nome do andar:", "1º andar");
    if (!name?.trim()) return;
    const order = (floors?.length || 0) + 1;
    const created = await safeRun(() =>
      createFloor({ unitId: selectedUnitId, name: name.trim(), order }),
    );
    await loadFloors({ unitId: selectedUnitId, preferFloorId: withId(created).id });
  };

  const handleAddArea = async () => {
    if (!selectedUnitId || !selectedFloorId) return;
    const created = await safeRun(() =>
      createArea({
        unitId: selectedUnitId,
        floorId: selectedFloorId,
        name: "Nova área",
        x: 380,
        y: 220,
        width: 220,
        height: 120,
      }),
    );
    const a = withId(created);
    await loadAreas({ unitId: selectedUnitId, floorId: selectedFloorId });
    await handleOpenAreaModal(a);
  };

  const handleSaveArea = async () => {
    if (!editingArea?.id) return;
    const updated = await safeRun(() => patchArea(editingArea.id, { name: editingArea.name }));
    const a = withId(updated);
    setEditingArea(a);
    setAreas((prev) => prev.map((x) => (x.id === a.id ? a : x)));
  };

  const handleDeleteArea = async () => {
    if (!editingArea?.id) return;
    const ok = window.confirm("Deseja excluir esta área?");
    if (!ok) return;
    await safeRun(() => deleteArea(editingArea.id));
    setIsAreaModalOpen(false);
    setEditingArea(null);
    setSelectedAreaId("");
    await loadAreas({ unitId: selectedUnitId, floorId: selectedFloorId });
  };

  const handleAddEquipment = async () => {
    if (!selectedAreaId) return;
    const trimmedName = equipmentDraft.nomeMaquina.trim();
    if (!trimmedName) return;

    if (editingEquipmentId) {
      await safeRun(() =>
        updateEquipment(editingEquipmentId, {
          ...equipmentDraft,
          nomeMaquina: trimmedName,
        }),
      );
    } else {
      await safeRun(() =>
        createEquipment({
          areaId: selectedAreaId,
          ...equipmentDraft,
          nomeMaquina: trimmedName,
        }),
      );
    }

    setEquipmentDraft((prev) => ({
      ...prev,
      proprietario: "",
      nomeMaquina: "",
      usuarioLogado: "",
      anydesk: "",
      armazenamentoLivre: "",
      observacoes: "",
    }));
    setEditingEquipmentId(null);
    await loadEquipments({ areaId: selectedAreaId });
  };

  const handleDeleteEquipment = async (equipmentId) => {
    await safeRun(() => deleteEquipment(equipmentId));
    await loadEquipments({ areaId: selectedAreaId });
  };

  const handleEditEquipment = (equipment) => {
    const e = withId(equipment);
    setEditingEquipmentId(e.id);
    setEquipmentDraft({
      tipo: e.tipo || "notebook",
      proprietario: e.proprietario || "",
      nomeMaquina: e.nomeMaquina || "",
      usuarioLogado: e.usuarioLogado || "",
      anydesk: e.anydesk || "",
      kaspersky: e.kaspersky || "",
      status: e.status || "ativo",
      armazenamentoLivre: e.armazenamentoLivre || "",
      observacoes: e.observacoes || "",
    });
  };

  const handleCancelEditEquipment = () => {
    setEditingEquipmentId(null);
    setEquipmentDraft((prev) => ({
      ...prev,
      proprietario: "",
      nomeMaquina: "",
      usuarioLogado: "",
      anydesk: "",
      kaspersky: "",
      armazenamentoLivre: "",
      observacoes: "",
    }));
  };

  const beginDrag = (event, area, mode = "move") => {
    if (!isEditMode) return;
    const a = withId(area);
    dragRef.current = {
      active: true,
      areaId: a.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: a.x || 0,
      originY: a.y || 0,
      originWidth: a.width || 220,
      originHeight: a.height || 120,
      mode,
    };
    setSelectedAreaId(a.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event) => {
    if (!isEditMode) return;
    const d = dragRef.current;
    if (!d.active || d.pointerId !== event.pointerId) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    setAreas((prev) =>
      prev.map((a) => {
        if (a.id !== d.areaId) return a;
        if (d.mode === "resize") {
          const nextWidth = Math.max(120, d.originWidth + dx);
          const nextHeight = Math.max(80, d.originHeight + dy);
          return { ...a, width: nextWidth, height: nextHeight };
        }
        return {
          ...a,
          x: Math.max(0, d.originX + dx),
          y: Math.max(0, d.originY + dy),
        };
      }),
    );
  };

  const endDrag = async (event) => {
    if (!isEditMode) return;
    const d = dragRef.current;
    if (!d.active || d.pointerId !== event.pointerId) return;
    dragRef.current.active = false;
    const area = areas.find((a) => a.id === d.areaId);
    if (!area) return;
    if (d.mode === "resize") {
      await safeRun(() =>
        patchArea(area.id, { width: area.width || 220, height: area.height || 120 }),
      );
    } else {
      await safeRun(() => patchArea(area.id, { x: area.x, y: area.y }));
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">
          <h1>Planta das Unidades Angelus</h1>
          <span>Unidades · Andares · Áreas · Equipamentos</span>
          {errorMsg ? <span style={{ color: "#b91c1c" }}>{errorMsg}</span> : null}
        </div>

        <div className="toolbar">
          <select
            className="select"
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            disabled={loading.units}
          >
            {units.length === 0 ? (
              <option value="">Sem unidades</option>
            ) : (
              units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))
            )}
          </select>

          <select
            className="select"
            value={selectedFloorId}
            onChange={(e) => setSelectedFloorId(e.target.value)}
            disabled={loading.floors || !selectedUnitId}
          >
            {floors.length === 0 ? (
              <option value="">Sem andares</option>
            ) : (
              floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            className="button button-primary"
            onClick={handleAddArea}
            disabled={!selectedUnitId || !selectedFloorId}
          >
            <span>+</span>
            <span>Adicionar área</span>
          </button>

          <form className="search-bar" onSubmit={handleSearchEquipments}>
            <select
              className="select"
              value={searchBy}
              onChange={(event) => setSearchBy(event.target.value)}
            >
              <option value="usuario">Usuário</option>
              <option value="maquina">Máquina</option>
            </select>
            <input
              className="field-input"
              placeholder={
                searchBy === "usuario"
                  ? "Buscar por usuário..."
                  : "Buscar por nome da máquina..."
              }
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button type="submit" className="button button-ghost">
              Buscar
            </button>
          </form>
        </div>
      </header>

      {searchTerm.trim() && (
        <section className="search-results">
          {searchLoading ? (
            <div className="equipment-meta">Buscando equipamentos...</div>
          ) : searchResults.length === 0 ? (
            <div className="equipment-meta">Nenhum equipamento encontrado.</div>
          ) : (
            <ul>
              {searchResults.map((equipment) => (
                <li key={equipment.id} className="equipment-meta">
                  <strong>{equipment.usuarioLogado || "-"}</strong> ·{" "}
                  <span>{equipment.nomeMaquina}</span>{" "}
                  {equipment.proprietario ? `· Proprietário: ${equipment.proprietario}` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <main className="canvas-container">
        <div className="canvas" onPointerMove={onDragMove} onPointerUp={endDrag}>
          {!selectedUnitId ? (
            <div className="empty-state">Crie ou selecione uma unidade.</div>
          ) : !selectedFloorId ? (
            <div className="empty-state">Crie ou selecione um andar.</div>
          ) : loading.areas ? (
            <div className="empty-state">Carregando áreas...</div>
          ) : areas.length === 0 ? (
            <div className="empty-state">
              Nenhuma área neste andar. Clique em &quot;Adicionar área&quot;.
            </div>
          ) : (
            areas.map((area) => (
              <button
                key={area.id}
                type="button"
                className={"area-card" + (area.id === selectedAreaId ? " selected" : "")}
                style={{
                  left: `${area.x || 0}px`,
                  top: `${area.y || 0}px`,
                  width: `${area.width || 220}px`,
                  height: `${area.height || 120}px`,
                }}
                onClick={() => {
                  if (isEditMode) return;
                  handleOpenAreaModal(area);
                }}
                onPointerDown={(e) => beginDrag(e, area, "move")}
              >
                <span className="area-name">{area.name}</span>
                {isEditMode ? (
                  <span
                    className="area-resize-handle"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      beginDrag(event, area, "resize");
                    }}
                  >
                    ⤢
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>

        <div className="bottom-toolbar">
          <button
            type="button"
            className="button button-ghost"
            onClick={() => setIsEditMode((v) => !v)}
            disabled={!selectedFloorId}
          >
            {isEditMode ? "Modo editar: ON" : "Modo editar: OFF"}
          </button>

          <button type="button" className="button button-ghost" onClick={handleAddUnit}>
            + Unidade
          </button>

          <button
            type="button"
            className="button button-ghost"
            onClick={handleAddFloor}
            disabled={!selectedUnitId}
          >
            + Andar
          </button>
        </div>
      </main>

      {isAreaModalOpen && editingArea ? (
        <AreaModal
          unitName={currentUnit?.name ?? ""}
          floorName={currentFloor?.name ?? ""}
          area={editingArea}
          onClose={() => {
            setIsAreaModalOpen(false);
            setEditingArea(null);
          }}
          onUpdateAreaName={(name) => setEditingArea((prev) => ({ ...prev, name }))}
          onSaveArea={handleSaveArea}
          onDeleteArea={handleDeleteArea}
          equipments={equipments}
          equipmentsLoading={loading.equipments}
          equipmentDraft={equipmentDraft}
          setEquipmentDraft={setEquipmentDraft}
          onAddEquipment={handleAddEquipment}
          onDeleteEquipment={handleDeleteEquipment}
          onEditEquipment={handleEditEquipment}
          onCancelEditEquipment={handleCancelEditEquipment}
          isEditingEquipment={Boolean(editingEquipmentId)}
        />
      ) : null}
    </div>
  );
}

function AreaModal({
  unitName,
  floorName,
  area,
  onClose,
  onUpdateAreaName,
  onSaveArea,
  onDeleteArea,
  equipments,
  equipmentsLoading,
  equipmentDraft,
  setEquipmentDraft,
  onAddEquipment,
  onDeleteEquipment,
          onEditEquipment,
          onCancelEditEquipment,
          isEditingEquipment,
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <div className="modal-title">Informações da área: {area.name}</div>
            <div className="equipment-meta">
              {unitName} · {floorName}
            </div>
          </div>
          <button type="button" className="button button-ghost" onClick={onClose}>
            Fechar
          </button>
        </header>

        <section className="modal-body">
          <div className="field-group">
            <label className="field-label" htmlFor="area-name">
              Nome da área
            </label>
            <input
              id="area-name"
              className="field-input"
              value={area.name}
              onChange={(event) => onUpdateAreaName(event.target.value)}
            />
          </div>

          <div className="field-group">
            <div className="field-label">Equipamentos cadastrados</div>
            <div className="equipments-list">
              {equipmentsLoading ? (
                <div className="equipment-meta">Carregando equipamentos...</div>
              ) : equipments.length === 0 ? (
                <div className="equipment-meta">Nenhum equipamento nesta área.</div>
              ) : (
                equipments.map((equipment) => (
                  <div key={equipment.id} className="equipment-card">
                    <div className="equipment-meta">
                      Tipo: <strong>{equipment.tipo}</strong>
                    </div>
                    <div className="equipment-meta">
                      Proprietário: <strong>{equipment.proprietario || "-"}</strong>
                    </div>
                    <div className="equipment-meta">
                      Máquina: <strong>{equipment.nomeMaquina}</strong>
                    </div>
                    <div className="equipment-meta">
                      Usuário: <strong>{equipment.usuarioLogado || "-"}</strong>
                    </div>
                    <div className="equipment-meta">
                      AnyDesk: <strong>{equipment.anydesk || "-"}</strong>
                    </div>
                    <div className="equipment-meta">
                      Kaspersky: <strong>{equipment.kaspersky || "-"}</strong>
                    </div>
                    <div className="equipment-meta">
                      Status:{" "}
                      <span
                        className={
                          "badge " +
                          (equipment.status === "ativo" ? "badge-success" : "badge-danger")
                        }
                      >
                        {equipment.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="equipment-meta">
                      Armazenamento livre: <strong>{equipment.armazenamentoLivre || "-"}</strong>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() => onDeleteEquipment(equipment.id)}
                      >
                        Remover
                      </button>
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() => onEditEquipment(equipment)}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">Adicionar equipamento</div>
            <div className="grid-two">
              <div className="field-group">
                <label className="field-label" htmlFor="tipo">
                  Tipo
                </label>
                <select
                  id="tipo"
                  className="field-select"
                  value={equipmentDraft.tipo}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, tipo: event.target.value }))
                  }
                >
                  <option value="notebook">Notebook</option>
                  <option value="desktop">Desktop</option>
                  <option value="impressora">Impressora</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="proprietario">
                  Proprietário
                </label>
                <input
                  id="proprietario"
                  className="field-input"
                  value={equipmentDraft.proprietario}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, proprietario: event.target.value }))
                  }
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="nomeMaquina">
                  Nome da máquina *
                </label>
                <input
                  id="nomeMaquina"
                  className="field-input"
                  value={equipmentDraft.nomeMaquina}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, nomeMaquina: event.target.value }))
                  }
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="usuarioLogado">
                  Usuário logado
                </label>
                <input
                  id="usuarioLogado"
                  className="field-input"
                  value={equipmentDraft.usuarioLogado}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, usuarioLogado: event.target.value }))
                  }
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="anydesk">
                  AnyDesk
                </label>
                <input
                  id="anydesk"
                  className="field-input"
                  value={equipmentDraft.anydesk}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, anydesk: event.target.value }))
                  }
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="kaspersky">
                  Kaspersky
                </label>
                <input
                  id="kaspersky"
                  className="field-input"
                  value={equipmentDraft.kaspersky}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, kaspersky: event.target.value }))
                  }
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  className="field-select"
                  value={equipmentDraft.status}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="armazenamentoLivre">
                  Armazenamento livre
                </label>
                <input
                  id="armazenamentoLivre"
                  className="field-input"
                  value={equipmentDraft.armazenamentoLivre}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({
                      ...prev,
                      armazenamentoLivre: event.target.value,
                    }))
                  }
                  placeholder="Ex: 20/100 GB"
                />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="observacoes">
                Observações
              </label>
              <textarea
                id="observacoes"
                className="field-textarea"
                value={equipmentDraft.observacoes}
                onChange={(event) =>
                  setEquipmentDraft((prev) => ({ ...prev, observacoes: event.target.value }))
                }
              />
            </div>
          </div>
        </section>

        <footer className="modal-footer">
          <button type="button" className="button button-ghost" onClick={onDeleteArea}>
            Excluir área
          </button>
          <button type="button" className="button button-ghost" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="button button-ghost" onClick={onSaveArea}>
            Salvar área
          </button>
          {isEditingEquipment ? (
            <>
              <button
                type="button"
                className="button button-ghost"
                onClick={onCancelEditEquipment}
              >
                Cancelar edição
              </button>
              <button type="button" className="button button-primary" onClick={onAddEquipment}>
                Atualizar equipamento
              </button>
            </>
          ) : (
            <button type="button" className="button button-primary" onClick={onAddEquipment}>
              Salvar equipamento
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

