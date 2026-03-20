import React, { useEffect, useMemo, useRef, useState } from "react";
import { createUnit, listUnits } from "./api/units";
import { createFloor, listFloors } from "./api/floors";
import { createArea, deleteArea, listAreas, patchArea, uploadAreaImage } from "./api/areas";
import { createText, deleteText, listTexts, patchText } from "./api/texts";
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

function getUploadsBaseUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && apiBase.startsWith("http")) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
    // In production, use current origin
    return window.location.origin;
  }

  return "";
}

const uploadsBaseUrl = getUploadsBaseUrl();

function buildImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (!uploadsBaseUrl) return path;
  return `${uploadsBaseUrl}${path}`;
}

export default function AppNew() {
  const [units, setUnits] = useState([]);
  const [floors, setFloors] = useState([]);
  const [areas, setAreas] = useState([]);
  const [textos, setTextos] = useState([]);

  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedTextoId, setSelectedTextoId] = useState("");

  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  const [isTextoModalOpen, setIsTextoModalOpen] = useState(false);
  const [editingTexto, setEditingTexto] = useState(null);

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
    textos: false,
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
    itemType: "area", // "area" | "texto"
    itemId: "",
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

  async function loadTextos({ unitId, floorId } = {}) {
    if (!unitId || !floorId) {
      setTextos([]);
      return [];
    }

    setLoading((p) => ({ ...p, textos: true }));
    try {
      const data = await safeRun(() => listTexts({ unitId, floorId }));
      const list = normalizeList(data);
      setTextos(list);
      return list;
    } finally {
      setLoading((p) => ({ ...p, textos: false }));
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
      setTextos([]);
      setSelectedFloorId("");
      setSelectedAreaId("");
      setSelectedTextoId("");
      setIsAreaModalOpen(false);
      setEditingArea(null);
      setIsTextoModalOpen(false);
      setEditingTexto(null);
      return;
    }
    loadFloors({ unitId: selectedUnitId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnitId]);

  useEffect(() => {
    setSelectedAreaId("");
    setIsAreaModalOpen(false);
    setEditingArea(null);
    setSelectedTextoId("");
    setIsTextoModalOpen(false);
    setEditingTexto(null);
    setEquipments([]);
    loadAreas({ unitId: selectedUnitId, floorId: selectedFloorId });
    loadTextos({ unitId: selectedUnitId, floorId: selectedFloorId });
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
    setIsTextoModalOpen(false);
    setEditingTexto(null);
    setSelectedTextoId("");

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
    const payload = {
      name: editingArea.name,
      printers: editingArea.printers || [],
    };
    const updated = await safeRun(() => patchArea(editingArea.id, payload));
    const a = { ...withId(updated), printers: payload.printers };
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

  const handleOpenTextoModal = (texto) => {
    setIsAreaModalOpen(false);
    setEditingArea(null);
    setSelectedAreaId("");
    setEquipments([]);
    setEditingEquipmentId(null);

    const t = withId(texto);
    setEditingTexto(t);
    setSelectedTextoId(t.id);
    setIsTextoModalOpen(true);
  };

  const handleAddTexto = async () => {
    if (!selectedUnitId || !selectedFloorId) return;
    const created = await safeRun(() =>
      createText({
        unitId: selectedUnitId,
        floorId: selectedFloorId,
        text: "Novo texto",
        x: 380,
        y: 220,
        width: 220,
        height: 60,
        fontSize: 14,
      }),
    );
    const t = withId(created);
    await loadTextos({ unitId: selectedUnitId, floorId: selectedFloorId });
    handleOpenTextoModal(t);
  };

  const handleUpdateTextoTextLocal = (value) => {
    if (!editingTexto) return;
    setEditingTexto((prev) => (prev ? { ...prev, text: value } : prev));
    setTextos((prev) => prev.map((t) => (t.id === editingTexto.id ? { ...t, text: value } : t)));
  };

  const handleUpdateTextoFontSizeLocal = (value) => {
    if (!editingTexto) return;
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    setEditingTexto((prev) => (prev ? { ...prev, fontSize: n } : prev));
    setTextos((prev) => prev.map((t) => (t.id === editingTexto.id ? { ...t, fontSize: n } : t)));
  };

  const handleSaveTexto = async () => {
    if (!editingTexto?.id) return;
    const payload = {
      text: editingTexto.text ?? "",
      fontSize: editingTexto.fontSize ?? 14,
    };
    const updated = await safeRun(() => patchText(editingTexto.id, payload));
    const t = withId(updated);
    setEditingTexto(t);
    setTextos((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  };

  const handleDeleteTexto = async () => {
    if (!editingTexto?.id) return;
    const ok = window.confirm("Deseja excluir este texto?");
    if (!ok) return;
    await safeRun(() => deleteText(editingTexto.id));
    setIsTextoModalOpen(false);
    setEditingTexto(null);
    setSelectedTextoId("");
    await loadTextos({ unitId: selectedUnitId, floorId: selectedFloorId });
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

  const handleUploadAreaImage = async (file) => {
    if (!editingArea?.id || !file) return;
    const updated = await safeRun(() => uploadAreaImage(editingArea.id, file));
    const a = withId(updated);
    setEditingArea(a);
    setAreas((prev) => prev.map((x) => (x.id === a.id ? a : x)));
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

  const beginDragArea = (event, area, mode = "move") => {
    if (!isEditMode) return;
    const a = withId(area);
    dragRef.current = {
      active: true,
      itemType: "area",
      itemId: a.id,
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

  const beginDragTexto = (event, texto, mode = "move") => {
    if (!isEditMode) return;
    const t = withId(texto);
    dragRef.current = {
      active: true,
      itemType: "texto",
      itemId: t.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: t.x || 0,
      originY: t.y || 0,
      originWidth: t.width || 220,
      originHeight: t.height || 60,
      mode,
    };
    setSelectedTextoId(t.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event) => {
    if (!isEditMode) return;
    const d = dragRef.current;
    if (!d.active || d.pointerId !== event.pointerId) return;

    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;

    if (d.itemType === "area") {
      setAreas((prev) =>
        prev.map((a) => {
          if (a.id !== d.itemId) return a;
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
      return;
    }

    // texto
    setTextos((prev) =>
      prev.map((t) => {
        if (t.id !== d.itemId) return t;
        if (d.mode === "resize") {
          const nextWidth = Math.max(80, d.originWidth + dx);
          const nextHeight = Math.max(24, d.originHeight + dy);
          return { ...t, width: nextWidth, height: nextHeight };
        }
        return {
          ...t,
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

    if (d.itemType === "area") {
      const area = areas.find((a) => a.id === d.itemId);
      if (!area) return;
      if (d.mode === "resize") {
        await safeRun(() =>
          patchArea(area.id, { width: area.width || 220, height: area.height || 120 }),
        );
      } else {
        await safeRun(() => patchArea(area.id, { x: area.x, y: area.y }));
      }
      return;
    }

    const texto = textos.find((t) => t.id === d.itemId);
    if (!texto) return;
    if (d.mode === "resize") {
      await safeRun(() =>
        patchText(texto.id, {
          width: texto.width || 220,
          height: texto.height || 60,
        }),
      );
    } else {
      await safeRun(() => patchText(texto.id, { x: texto.x, y: texto.y }));
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
          ) : loading.areas || loading.textos ? (
            <div className="empty-state">Carregando itens...</div>
          ) : areas.length === 0 && textos.length === 0 ? (
            <div className="empty-state">
              Nenhum item neste andar. Clique em &quot;Adicionar área&quot; ou &quot;+ Texto&quot;.
            </div>
          ) : (
            <>
              {areas.map((area) => (
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
                  onPointerDown={(e) => beginDragArea(e, area, "move")}
                >
                  <span className="area-name">{area.name}</span>
                  {isEditMode ? (
                    <span
                      className="area-resize-handle"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        beginDragArea(event, area, "resize");
                      }}
                    >
                      ⤢
                    </span>
                  ) : null}
                </button>
              ))}

              {textos.map((texto) => (
                <button
                  key={texto.id}
                  type="button"
                  className={"texto-card" + (texto.id === selectedTextoId ? " selected" : "")}
                  style={{
                    left: `${texto.x || 0}px`,
                    top: `${texto.y || 0}px`,
                    width: `${texto.width || 220}px`,
                    height: `${texto.height || 60}px`,
                  }}
                  onClick={() => {
                    if (isEditMode) return;
                    handleOpenTextoModal(texto);
                  }}
                  onPointerDown={(e) => beginDragTexto(e, texto, "move")}
                >
                  <span
                    className="texto-content"
                    style={{ fontSize: `${texto.fontSize || 14}px` }}
                  >
                    {texto.text || ""}
                  </span>
                  {isEditMode ? (
                    <span
                      className="area-resize-handle"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        beginDragTexto(event, texto, "resize");
                      }}
                    >
                      ⤢
                    </span>
                  ) : null}
                </button>
              ))}
            </>
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

          <button
            type="button"
            className="button button-ghost"
            onClick={handleAddTexto}
            disabled={!selectedUnitId || !selectedFloorId}
          >
            + Texto
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
          onUpdateAreaName={(name) =>
            setEditingArea((prev) => (prev ? { ...prev, name } : prev))
          }
          onUpdateAreaPrinters={(printers) =>
            setEditingArea((prev) => (prev ? { ...prev, printers } : prev))
          }
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
          onUploadAreaImage={handleUploadAreaImage}
        />
      ) : null}

      {isTextoModalOpen && editingTexto ? (
        <TextoModal
          unitName={currentUnit?.name ?? ""}
          floorName={currentFloor?.name ?? ""}
          texto={editingTexto}
          onClose={() => {
            setIsTextoModalOpen(false);
            setEditingTexto(null);
          }}
          onUpdateTextoText={(value) => handleUpdateTextoTextLocal(value)}
          onUpdateTextoFontSize={(value) => handleUpdateTextoFontSizeLocal(value)}
          onSaveTexto={handleSaveTexto}
          onDeleteTexto={handleDeleteTexto}
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
  onUpdateAreaPrinters,
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
          onUploadAreaImage,
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
            <label className="field-label" htmlFor="area-printers">
              Impressoras da área (uma por linha)
            </label>
            <textarea
              id="area-printers"
              className="field-textarea"
              value={(area.printers || []).join("\n")}
              onChange={(event) => {
                const lines = event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean);
                onUpdateAreaPrinters(lines);
              }}
              placeholder="Exemplo:\nHP LaserJet 123\nBrother XYZ"
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
                    <div className="equipment-actions">
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
            <div className="field-label">Imagem da área</div>
            {area.imagemUrl ? (
              <div className="area-image-wrapper">
                <img src={buildImageUrl(area.imagemUrl)} alt={area.name} className="area-image" />
              </div>
            ) : (
              <div className="equipment-meta">Nenhuma imagem cadastrada para esta área.</div>
            )}
            <div className="area-image-actions">
              <label className="button button-ghost equipment-upload-button">
                <span>{area.imagemUrl ? "Trocar imagem da área" : "Adicionar imagem da área"}</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(event) =>
                    onUploadAreaImage(event.target.files?.[0] || null)
                  }
                />
              </label>
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

function TextoModal({
  unitName,
  floorName,
  texto,
  onClose,
  onUpdateTextoText,
  onUpdateTextoFontSize,
  onSaveTexto,
  onDeleteTexto,
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <div className="modal-title">Informações do texto</div>
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
            <label className="field-label" htmlFor="texto-content">
              Conteúdo (multilinha)
            </label>
            <textarea
              id="texto-content"
              className="field-textarea"
              value={texto.text || ""}
              onChange={(event) => onUpdateTextoText(event.target.value)}
              placeholder={"Digite aqui...\nEx: Linha 1\nLinha 2"}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="texto-fontSize">
              Tamanho da fonte (px)
            </label>
            <input
              id="texto-fontSize"
              type="number"
              min={6}
              max={200}
              className="field-input"
              value={texto.fontSize ?? 14}
              onChange={(event) => onUpdateTextoFontSize(event.target.value)}
            />
          </div>
        </section>

        <footer className="modal-footer">
          <button type="button" className="button button-ghost" onClick={onDeleteTexto}>
            Excluir texto
          </button>
          <button type="button" className="button button-ghost" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="button button-primary" onClick={onSaveTexto}>
            Salvar texto
          </button>
        </footer>
      </div>
    </div>
  );
}

