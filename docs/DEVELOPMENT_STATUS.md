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

### Simulador local de lances (2026-11-09)
- Botão do simulador corrigido para exibir o incremento formatado em moeda, em vez da interpolação literal; commit `b24039db8b9278b413ca6d4c3e80bd8c8058c544`.
- Usuário confirmou em capturas a atualização do texto para **Simular lance de R$ 0,01**, e anteriormente verificou um lance hipotético com preço **R$ 0,01** e custo hipotético **R$ 0,50**; `npm run typecheck` / `tsc --noEmit` sem erros.
- Simulação é local, não gera POST, não altera carteira nem preço real. **Homologação concluída; não repetir sem regressão.**
- Próxima prioridade: revisar e preparar indicadores de elegibilidade de participação (sessão, saldo, estado do leilão, conectividade), sempre sem liberar lances financeiros; aproveitar `services/bids.ts` e fluxos existentes.


### Painel de condições de participação (2026-11-09)
- Commit frontend `8273f930b3f814a466560deab8462a7e8753cd8c`: painel informativo de conta, estado do leilão, saldo e comunicação do servidor em `RegisteredAuctionDetail.tsx`, mantendo o botão financeiro desabilitado.
- Usuário enviou capturas comprovando conta conectada, leilão ativo aguardando primeiro lance, saldo R$ 0,00 insuficiente para custo R$ 0,50, consulta ao servidor disponível e lances reais indisponíveis. `npm run typecheck` (`tsc --noEmit`) sem erros. **Interface homologada.**
- Próximo passo: revisar consistência visual e acessibilidade do painel, e depois planejar homologação segura do fluxo de lance financeiro em ambiente isolado; não ativar `AUCTION_BIDDING_ENABLED` sem autorização explícita.


### Modal informativa de lance (2026-11-09, noite)
- Corrigida a posição da modal `showBidInfo`: estava dentro de `<details className="registered-support-tools">`, de modo que só aparecia após expandir as ferramentas de suporte. Agora é irmã de `<details>`, independente da expansão; commit frontend `43cda801061e4b4d93deaab35d7e1c0fa5c7c6c8`.
- Usuário comprovou por captura a modal **Confirmação de lance — prévia** aberta com ferramentas fechadas; `npm run typecheck` (`tsc --noEmit`) sem erros. **Correção homologada**.
- A modal é somente informativa, e lances reais continuam indisponíveis. Não repetir esse teste sem regressão.

### Revisão mobile e segurança financeira isolada (2026-11-11)
- Frontend: modal informativa revisada com bloqueio da rolagem do fundo, restauração de foco e limite de altura com rolagem interna; commits `bf4049f` e `c2f58bd`. Usuário confirmou captura mobile em 375 × 877 px com janela integralmente visível e `npm run typecheck` sem erros. Layout mobile aprovado; navegação por teclado ainda não foi verificada manualmente.
- Backend: nome legado `marketplace-miniaturas-3d` corrigido para `show-de-centavos-api` em `package.json` e `package-lock.json`; commits `6e38a81` e `4cb611e`.
- Ambiente atual validado pelo usuário: MongoDB replica set `walletTestRS` porta 27018; API completa porta 3001 com `AUCTION_BIDDING_ENABLED=false`; frontend porta 3000; login funcionando. O script de demonstração na porta 3002 não fornece autenticação e não deve substituir a API completa.
- Usuário executou em 2026-11-11 três testes isolados, todos aprovados sem falhas: `auctionBidDisabled.test.js` (1/1), `auctionBidRollback.test.js` (1/1), `auctionBidFinishRace.test.js` (1/1). Confirmados bloqueio sem escrita, rollback de débito/lance/preço e rejeição de lance vencido durante encerramento. **Não repetir sem regressão.**
- Próximo passo: revisar testes já existentes de concorrência/idempotência e cobertura residual antes de qualquer homologação financeira mais ampla. **Não habilitar lances reais na API principal sem autorização explícita.**

### Proteção adicional no cliente de lances (2026-11-11)
- Revisados `services/bids.ts`, `RegisteredAuctionDetail.tsx`, testes de concorrência e integração da API. A interface permanece apenas informativa, sem chamadas POST de lance.
- Commit frontend `1d5631d`: `submitConfirmedBid` agora exige opção explícita `financialBidsEnabled: true` para efetuar POST; padrão bloqueado. A flag de backend `AUCTION_BIDDING_ENABLED=false` continua obrigatória na homologação atual.
- Pendente: usuário executar `npm run typecheck` após atualizar frontend. Não foi executado teste de runtime desta alteração.
- Próximo passo: validar typecheck, depois preparar testes de unidade do serviço do cliente e fluxo de reconciliação sem liberar pagamentos.

### Testes isolados do cliente de lances (2026-11-11)
- Criado `tests/bids.test.cjs` (commit `7ef428e`) com sete cenários simulados sem POST financeiro real: bloqueio por padrão, envio único sob liberação explícita, chave inválida, resposta inconsistente, consulta somente GET, consulta 404 e falha de rede incerta.
- Adicionado `npm run test:bids` em `package.json` (commit `bc68845`). **Executados pelo usuário em 2026-11-11: 7/7 aprovados, 0 falhas.**
- Usuário confirmou `npm run typecheck` (`tsc --noEmit`) sem erros. Próximo passo: preparar interface de acompanhamento e reconciliação de tentativas sem envio financeiro; não habilitar lances reais.

### Interface de recuperação de tentativas (2026-11-11)
- Commit frontend `eca0945`: aprimoradas instruções da ferramenta de consulta por chave, adicionada opção `Limpar consulta`, explicitado resultado encontrado e ausência de qualquer envio financeiro. Consulta permanece somente GET.
- Usuário confirmou `npm run typecheck` sem erros e enviou captura desktop da área expandida: textos, campo e botões de consulta/limpeza visíveis; botão financeiro continua desabilitado. **Homologação visual desktop aprovada.** Consulta manual com chave real não foi realizada. Não habilitar lances reais.

### Consulta de tentativas responsiva (2026-11-11)
- Commits frontend `4d6e1dc` e `1b44806`: estilos responsivos para campo UUID, foco visível e botões de consulta/limpeza em coluna até 480 px; sem alterações no envio financeiro.
- Usuário executou `npm run typecheck` sem erros e enviou captura da seção expandida em **desktop** (campo e botões com estilos aplicados). Usuário enviou captura em modo dispositivo **375 × 877 px**, confirmando campo UUID sem transbordamento e botões de consulta/limpeza empilhados e legíveis. **Homologação visual mobile aprovada**. Não repetir testes financeiros já aprovados sem regressão.

### Preflight informativo para confirmação de lance (2026-11-11)
- Commits frontend `3e89549`, `3f6f536`: criado `services/bidPreflight.ts` e integrado à modal de prévia. Verifica autenticação, estado do leilão, disponibilidade do servidor, saldo e custo válido, sem autorizar operações financeiras.
- Commits `bd99939`, `26d176c`: 10 testes isolados em `tests/bidPreflight.test.cjs`, comando `npm run test:bid-preflight`. **Usuário executou em 2026-11-11: 10/10 testes aprovados, 0 falhas e `npm run typecheck` sem erros.**
- Próximo passo: executar testes do preflight e typecheck; nenhuma alteração em flags financeiras.

### Máquina de estados de tentativa de lance (2026-11-11)
- Commits `c2e9799`, `2fab551`, `4b58d06`: criado `services/bidAttemptState.ts` (idle, submitting, uncertain, reconciling, confirmed, rejected) e sete testes isolados; comando `npm run test:bid-attempt`.
- Regra: resultado incerto ou 404 na consulta mantém a chave e bloqueia novo início automático. Ainda não integrado ao botão ou POST; nenhuma cobrança liberada.
- Usuário executou em 2026-11-11: `npm run test:bid-attempt` **7/7 aprovados, 0 falhas**, e `npm run typecheck` sem erros. Próximo passo: integrar acompanhamento apenas informativo à interface; sem habilitar POST financeiro.

### Painel informativo de acompanhamento de tentativas (2026-11-11)
- Commits `541d227`, `72db24b`, `41c54b2`: criado `BidAttemptStatus.tsx`, inserido nas ferramentas de suporte e estilizado para mobile/desktop. Exibe os seis estados previstos, mensagens e chave original quando houver tentativa.
- **Estado atual fixo `idle`**, pois não há POST financeiro nem evento de tentativa ligado à página. Não alegar que monitora tentativas reais nesta etapa.
- Usuário confirmou em 2026-11-11: `npm run typecheck` sem erros; captura mobile 375×877 aprovada, painel `idle` visível, sem overflow, botão financeiro bloqueado. Próxima implementação: conectar estados apenas quando houver um fluxo controlado de tentativa, sem habilitar financeiro sem autorização.

### Integração de consulta GET ao monitor (2026-11-11)
- Commits `b1efea1`, `1af8d47`, `406d6b8`: painel mostra última consulta avulsa por UUID (checking, found, not_found, unavailable, mismatch), sem alterar o estado de tentativa real (`idle`). Chave não pode ser editada enquanto GET está pendente. Limpar consulta também limpa o resumo.
- Nenhum POST, débito, retry automático ou ativação financeira. Homologado em 2026-11-11: usuário executou `npm run typecheck` sem erros e consultou UUID de teste; API retornou `not_found`, monitor exibiu resultado sem alterar `idle`, screenshot mobile 375×877 aprovado. Nenhum POST financeiro.

## Próximo passo exato
1. **Não repetir** a homologação SSE do backend, o ciclo agendamento/encerramento ou a correção de Ganhadores sem mudança que justifique regressão.
2. **Painel de elegibilidade aprovado**. Próximo passo: revisar consistência visual e acessibilidade, depois planejar testes financeiros isolados sem habilitar lances reais.
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
