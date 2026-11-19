# Show de Centavos — contexto recuperável para novas conversas e agentes

Atualizado: 2026-11-17. **Ler o código atual antes de confiar neste resumo.**

## Objetivo
Plataforma de leilões por centavos. Frontend Next.js/React/TypeScript, backend Node.js/Express, MongoDB com replica set, eventos SSE. Em desenvolvimento; **lances financeiros desabilitados**.

## Repositórios e branches
- Frontend: `joieloliveira/showDeCentavos-app` — `feature/frontend-initial`
- API: `joieloliveira/showDeCentavos-api` — `feature/wallet-pix-deposits`
- Não editar `main` sem aprovação. Usar commits rastreáveis.

## Documentos para recuperar contexto (busca direcionada, base RAG)
1. `AGENTS.md`: regras obrigatórias para agentes.
2. `docs/DEVELOPMENT_STATUS.md`: cronologia, testes e pendências; priorizar entradas mais recentes.
3. `docs/GUIA_FUNCIONAL.md`: tutorial de operação e regras para usuário.
4. `services/bids.ts`, `services/bidAttemptState.ts`, `services/bidAttemptJournal.ts`, `services/bidAttemptReconciliation.ts`, `services/bidLookupGuard.ts`: segurança de lances e recuperação.
5. `components/auctions/RegisteredAuctionDetail.tsx`: SSE, detalhe de leilão, simulador, consultas.
6. `tests/`: testes existentes; checar scripts em `package.json`.
7. Código da API no repositório irmão: fonte autoritativa para contratos HTTP e transações.

Este índice permite **recuperação documental sob demanda** (padrão RAG leve). Não há neste momento indexação vetorial, embeddings ou serviço RAG automático instalado. MCP/GitHub é a via de acesso às fontes; não é memória por si só.

## Ambiente local conhecido (Windows Git Bash)
- Terminal 1: MongoDB 8.2, replica set `walletTestRS`, porta `27018`, diretório `C:/data/wallet-test`.
- Terminal 2: API porta `3001`, `MONGO_URI=mongodb://127.0.0.1:27018/wallet_test_pix?replicaSet=walletTestRS`, `AUCTION_BIDDING_ENABLED=false`.
- Terminal 3: Next.js porta `3000`, `NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api`.
- Terminal 4: comandos/testes. Confirmar o caminho local do checkout antes de fornecer comandos.
- Não executar `rs.initiate()` novamente; não apagar banco.

## Última posição conhecida (2026-11-17)
- Segurança de consulta GET e recuperação após F5 implementada e testada em laboratório. Troca de leilão e logout/login homologados visualmente; não equivalem a testes financeiros reais.
- 84 testes frontend previamente homologados (até 2026-11-12), sem contar alterações posteriores não testadas automaticamente. Não presumir execução nova.
- Simulador educativo com preço-base fixado ao abrir, incremento e custo por lance distintos. Em 2026-11-15 foram homologados três lances hipotéticos: aumento R$ 0,03, custo total R$ 1,50.
- Em 2026-11-17 foram adicionados cartões visuais para incremento e custo, commit `fd2350b`. `npm run typecheck` aprovado pelo usuário; cartões aprovados em captura desktop de 2026-11-17.
- Simulador validado em 2026-11-17 no Chrome headless com leilões fictícios. A referência permaneceu fixa durante atualização por SSE e por polling com SSE interrompido. Reabrir capturou o novo preço, e trocar de leilão descartou a simulação. Cartões verificados no desktop e em 375 × 877 px. Fluxo via Tab e Enter verificado a partir do painel de ferramentas. Ver detalhes em DEVELOPMENT_STATUS.md.
- Administração de leilões em 2026-11-17: cadastro valida os centavos e exibe erros da API; confirmação de início da espera permanece visível; estados da lista e dos detalhes foram alinhados. O histórico de auditoria atualiza com os detalhes abertos, e mudanças na contagem atualizam o histórico de lances e o resumo de conciliação. Falhas ao trocar o filtro não exibem linhas de outra consulta. TypeScript, ESLint dos componentes e cenários no Chrome com API fictícia aprovados. Ver detalhes em DEVELOPMENT_STATUS.md.

## Como retomar em novo chat ou Codex
1. Ler `AGENTS.md` e este documento.
2. Conferir HEAD/branch e mudanças locais nos dois repositórios.
3. Ler últimas seções de `docs/DEVELOPMENT_STATUS.md` e os arquivos diretamente afetados.
4. Resumir o que está comprovado e o que falta; propor a menor próxima tarefa.
5. Implementar, testar de modo direcionado, registrar resultado real e atualizar este índice quando a posição mudar.

## Limitações e segurança
Documentação e recuperação ajudam a reduzir perda de contexto e alucinações, mas não garantem precisão. Nunca tratar histórico de chat ou resumo como substituto de código/testes atuais. Não copiar segredos nem dados pessoais para índice ou prompts.
