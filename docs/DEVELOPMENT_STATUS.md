# Show de Centavos — Estado do desenvolvimento

Atualizado em: 2026-11-09 (America/Sao_Paulo)

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
- DevTools Network exibiu requisição `events` com HTTP 200 e tipo `event-stream`.
- **2026-11-09: HOMOLOGADO envio SSE pelo backend em teste manual com `curl -N`** no endpoint `/api/auctions/6af2298f01f89eff94a2b6c4/events` (ID temporário, não reutilizar). Foram recebidos `: connected`, `: heartbeat` e três mensagens `event: auction-update` com `data.status` `scheduled`, `active` e `finished`; `currentPriceCents: 1` e `bidCount: 1`. O evento foi recebido diretamente no stream, independente do polling do navegador. **Não repetir essa verificação sem regressão relevante.**
- A integração visual do frontend já foi observada, mas não foi isolado o comportamento de atualização visual sem polling; manter essa distinção se necessário.
- Script verificado: `src/scripts/browserAuctionCountdownDemo.js` (API, branch de trabalho). Usa apenas URI local de testes `mongodb://127.0.0.1:27018/wallet_test_pix?replicaSet=walletTestRS`, porta 3002, endpoint `POST /demo/schedule`, e remove registros temporários com Ctrl+C. Frontend demonstrativo aponta para `http://127.0.0.1:3002/api`. Não usar banco de produção.

### Interface
- Página `/auctions`: cards, responsividade, galeria por toque/setas previamente verificada.
- Página `/winners`: imagens corrigidas para `objectFit: cover`, sem `maxHeight: 230`, alinhadas à vitrine de leilões.
- Commit de correção: `baa82b628d8a0e34058381cbc34c644640804e2b` em `feature/frontend-initial`.
- Em 2026-11-08, usuário enviou captura de `/winners` em viewport mobile 320px com aparência aprovada e saída de `npm run typecheck` / `tsc --noEmit` sem erros.


### Autenticação, carteira e navegação (2026-11-09)
- Frontend `components/auctions/RegisteredAuctionDetail.tsx`: link contextual sob **Minha carteira**: autenticado → `/wallet` ("Ver minha carteira"); visitante → `/login?next=...` ("Entrar na minha conta"). Commit `c3e138c88b55bae30ab71f59e9dd403d7de4eab4`; `npm run typecheck` reportado sem erros.
- API demonstrativa da porta 3002 **não implementa login/cadastro/carteira**. Para verificar autenticação, foi iniciada API completa na porta **3001**, com `MONGO_URI=mongodb://127.0.0.1:27018/wallet_test_pix?replicaSet=walletTestRS`, `AUCTION_BIDDING_ENABLED=false`; frontend iniciado com `NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api`.
- Usuário confirmou cadastro e login reais na API local; capturas de `/wallet` mostraram sessão autenticada, saldo **R$ 0,00**, sem movimentações, PIX real desabilitado.
- Capturas de `/auctions/registered/[id]` mostraram o link **Ver minha carteira**, saldo **R$ 0,00**, lances reais indisponíveis; segunda captura confirmou navegação para `/wallet` com sessão mantida. **Fluxo autenticado aprovado**. Em 2026-11-09, **fluxo visitante com retorno após login aprovado por duas capturas**: antes, link "Entrar na minha conta" em leilão; após login em janela privativa, URL do mesmo leilão preservada, nome do usuário exibido e link "Ver minha carteira" com saldo R$ 0,00.
- Atenção: um leilão temporário de demonstração ainda aparecia na listagem da API completa após encerramento do script de demonstração; investigar limpeza residual com cautela antes de excluir dados. Não presumir que foi limpo.
- Terminais atuais: **1 BACKEND MongoDB replicaSet 27018; 2 BACKEND API completa 3001; 3 BACKEND antigo SSE encerrado; 4 BACKEND comandos disponível; 5 FRONTEND Next.js 3000**.


### Estado ativo sem lances (2026-11-09)
- Leilão criado pelo painel administrativo e iniciado após espera de 1 minuto; API completa porta 3001 retornou `status: active`, `bidCount: 0`, `endsAt: null`. Esse estado é esperado: cronômetro de 15 segundos depende do primeiro lance válido.
- `RegisteredAuctionDetail.tsx` agora exibe **Aguardando o primeiro lance** com explicação explícita nesse estado; commit `6559013ca4a9c0debb77f3c8ef4a53d9648a0c33`.
- Usuário confirmou em capturas o aviso, conexão em tempo real, carteira e botão financeiro desabilitado; `npm run typecheck` / `tsc --noEmit` sem erros. **Interface aprovada.** Não repetir teste sem regressão.

## Próximo passo exato
1. **Não repetir** a homologação SSE do backend, o ciclo agendamento/encerramento ou a correção de Ganhadores sem mudança que justifique regressão.
2. **Próximo passo: escolher com o desenvolvedor a próxima funcionalidade/revisão de produto**, consultando o código atual e mantendo lances financeiros desativados até autorização/revisão específica.
3. Atualizar este documento **ao final de marcos importantes**, registrando data, branch, commit, evidência, pendência e próximo passo; não registrar testes como aprovados sem evidência.

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
