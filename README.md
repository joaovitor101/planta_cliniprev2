# PLANTA_CLINIPREV2

Versão 2 da planta (unidades → andares → áreas no canvas → equipamentos).

## Requisitos

- Node.js 18+ (recomendado)
- Conta no MongoDB Atlas (String de conexão)

## Configuração

1. Crie um arquivo `.env` na raiz do projeto (use `.env.example` como base):

   - `MONGODB_URI`: string de conexão do Atlas
   - `PORT`: porta da API (padrão 4000)

2. Instale dependências:

```bash
npm install
```

## Rodar (frontend + backend)

```bash
npm run dev:all
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Healthcheck: `http://localhost:4000/api/health`

## Como usar

1. Clique em **+ Unidade** para criar uma unidade.
2. Selecione a unidade e clique em **+ Andar**.
3. Selecione o andar e clique em **Adicionar área**.
4. Clique em uma área para abrir o modal e cadastrar equipamentos.
5. Ative **Modo editar** para arrastar as áreas no canvas (salva `x/y` no banco).

## Endpoints principais (API)

- `GET/POST /api/units`
- `GET/POST /api/floors?unitId=...`
- `GET/POST /api/areas?unitId=...&floorId=...`
- `PATCH/DELETE /api/areas/:id`
- `GET/POST /api/equipments?areaId=...`
- `DELETE /api/equipments/:id`

