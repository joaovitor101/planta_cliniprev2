const express = require("express");
const router = express.Router();
const Equipment = require("../models/Equipment");

// Rota: GET /api/powerbi/equipamentos
// Retorna os dados já formatados (planificados) para o Power BI ler perfeitamente.
router.get("/equipamentos", async (req, res) => {
  try {
    // Busca todos os equipamentos e já "puxa" os dados completos da Área, Andar e Unidade
    const equipamentos = await Equipment.find().populate({
      path: "areaId",
      populate: [
        { path: "unitId", select: "name" },
        { path: "floorId", select: "name" },
      ],
    });

    // Mapeia os dados transformando em uma tabela plana (sem listas/objetos aninhados)
    const dadosFormatados = equipamentos.map((eq) => ({
      ID: eq._id.toString(),
      "Nome da Maquina": eq.nomeMaquina,
      Tipo: eq.tipo,
      Status: eq.status,
      Proprietario: eq.proprietario || "",
      "Usuário Logado": eq.usuarioLogado || "",
      AnyDesk: eq.anydesk || "",
      Kaspersky: eq.kaspersky || "",
      "Armazenamento Livre": eq.armazenamentoLivre || "",
      Observacoes: eq.observacoes || "",
      // Dados do Setor/Unidade (verifica se existe antes de acessar para não dar erro)
      Setor: eq.areaId ? eq.areaId.name : "Sem Setor",
      Andar: eq.areaId && eq.areaId.floorId ? eq.areaId.floorId.name : "Sem Andar",
      Unidade: eq.areaId && eq.areaId.unitId ? eq.areaId.unitId.name : "Sem Unidade",
      
      "Data de Criacao": eq.createdAt,
      "Ultima Atualizacao": eq.updatedAt,
    }));

    // Retorna o Array limpo para o Power BI
    res.json(dadosFormatados);
  } catch (error) {
    console.error("Erro na rota do Power BI:", error);
    res.status(500).json({ error: "Erro ao gerar dados para o Power BI" });
  }
});

module.exports = router;
