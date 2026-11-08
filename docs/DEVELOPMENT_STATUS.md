# Show de Centavos — Estado do desenvolvimento

Atualizado em: 2026-11-08 (America/Sao_Paulo)

> **Documento de continuidade entre conversas.** Fonte de orientação, não substitui o código nem os testes. Ao retomar, conferir a branch e os commits atuais no GitHub e eventuais mudanças locais não enviadas.

## Repositórios e branches de trabalho
- Frontend: https://github.com/joieloliveira/showDeCentavos-app — `feature/frontend-initial`
- API: https://github.com/joieloliveira/showDeCentavos-api — `feature/wallet-pix-deposits`
- **Não alterar `main`.** O assistente implementa e comita nas branches de trabalho; o desenvolvedor executa `git pull --ff-only` e testa localmente. Antes de modificar, conferir código remoto e evitar sobrescrever alterações locais.
- Informar antecipadamente se for necessário `npm install`, Insomnia ou acesso ao MongoDB. Priorizar testes direcionados e evitar reexecutar suítes inteiras sem necessidade.

## Stack e arquitetura
- Frontend: Next.js 15 App Router, React, TypeScript, Axios. Páginas `/auctions`, `/winners`, `/auctions/registered/[id]`, `/auctions/demo-live`.
- Backend: Node.js/Express, MongoDB/Mongoose, eventos SSE; carteira, depósitos PIX, lances e históricos.
- Em homologação, **lances financeiros reais desativados**. Não habilitar `AUCTION_BIDDING_ENABLED` sem autorização explícita e revisão de segurança.

## Implementado e evidências de homologação
### Carteira / PIX / lances (histórico de desenvolvimento)
- Serviço de aprovação de depósitos com transação e ledger; relatos de **17 testes** de pagamentos/PIX, incluindo idempotência sob concorrência e rollback.
- Testes de integração de lances: **11/11** reportados, incluindo perda de resposta sem dupla cobrança e restrição de chave de idempotência por leilão.
- Histórico de lances: **4/4**; histórico de vitórias: **4/4**; endereço do ganhador: **8/8** reportados.
- Esses resultados são registros de homologações anteriores; verificar código/CI se mudanças posteriores afetarem essas áreas. **Não repetir automaticamente.**

### SSE / leilões
- Testes SSE anteriores: **3/3** reportados (broadcast por leilão, limpeza/desconexões e reconexão).
- `components/auctions/RegisteredAuctions.tsx`: consulta periódica a cada 5 segundos; `EventSource` para leilões ativos e atualização após `auction-update`. O cronômetro visual atualiza a cada segundo.
- 2026-11-08: demonstração em `/auctions` exibiu **Agendado → Em andamento (cronômetro em 5s e 10s) → Encerrado**, com ganhador e preço final de R$ 0,01, conforme capturas do navegador.
- Terminal do backend confirmou quatro ciclos de ativação/encerramento.
- DevTools Network exibiu requisição `events` com HTTP 200 e tipo `event-stream`. **Ainda não foi capturado o conteúdo de `auction-update` na aba EventStream/Response**. Não afirmar que o recebimento da mensagem específica foi homologado; o polling também pode explicar atualização dos cards.
- Script verificado: `src/scripts/browserAuctionCountdownDemo.js` (API, branch de trabalho). Usa apenas URI local de testes `mongodb://127.0.0.1:27018/wallet_test_pix?replicaSet=walletTestRS`, porta 3002, endpoint `POST /demo/schedule`, e remove registros temporários com Ctrl+C. Frontend demonstrativo aponta para `http://127.0.0.1:3002/api`. Não usar banco de produção.

### Interface
- Página `/auctions`: cards, responsividade, galeria por toque/setas previamente verificada.
- Página `/winners`: imagens corrigidas para `objectFit: cover`, sem `maxHeight: 230`, alinhadas à vitrine de leilões.
- Commit de correção: `baa82b628d8a0e34058381cbc34c644640804e2b` em `feature/frontend-initial`.
- Em 2026-11-08, usuário enviou captura de `/winners` em viewport mobile 320px com aparência aprovada e saída de `npm run typecheck` / `tsc --noEmit` sem erros.

## Próximo passo exato
1. **Não repetir** o ciclo completo de agendamento/encerramento nem a correção de Ganhadores: ambos já observados.
2. Se for relevante concluir a prova de SSE puro, capturar uma mensagem `auction-update` em EventStream/Response de uma conexão ativa; alternativamente adicionar teste automatizado específico que diferencie evento SSE de polling. Uma conexão HTTP 200 `event-stream` não prova sozinha o recebimento do evento.
3. Depois planejar a próxima funcionalidade de produto com o desenvolvedor, mantendo lances financeiros desativados até homologação/autorização específica.
4. Atualizar este documento **ao final de marcos importantes**, registrando data, branch, commit, evidência, pendência e próximo passo; não registrar testes como aprovados sem evidência.

## Comandos locais úteis
```bash
# Frontend
git pull --ff-only origin feature/frontend-initial
npm run typecheck

# API: ambiente isolado de demonstração (Git Bash)
export WALLET_TEST_MONGODB_URI="mongodb://127.0.0.1:27018/wallet_test_pix?replicaSet=walletTestRS"
node src/scripts/browserAuctionCountdownDemo.js
# Em outro terminal:
curl -X POST http://127.0.0.1:3002/demo/schedule
# Ao terminar: Ctrl+C no processo demonstrativo para limpeza
```

## Protocolo para nova conversa
Pedir: **"Continue o Show de Centavos. Leia `docs/DEVELOPMENT_STATUS.md` na branch `feature/frontend-initial` do GitHub e confirme o próximo passo antes de implementar."**
Conferir ambos os repositórios nas branches acima. Não presumir que o arquivo está atualizado se houver commits posteriores. Evitar recapitulações extensas e testes já aprovados, salvo regressão concreta.
