# Show de Centavos — Guia funcional e tutorial de uso

> Documento vivo. Conferir sempre com o código, com a API e com o histórico de homologação em [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md). **O projeto está em desenvolvimento e não está liberado para operação financeira pública.**

## 1. O que é o Show de Centavos?

É uma plataforma de leilões por centavos. Cada leilão apresenta um produto, preço atual, custo de participação e estado (agendado, ativo, encerrado ou cancelado). A experiência prevista envolve conta de usuário, carteira, lances, histórico e entrega ao vencedor. **A existência de uma tela ou endpoint não significa que a funcionalidade esteja liberada comercialmente.**

## 2. Como navegar e aprender as funcionalidades

| Área | Objetivo | Como experimentar com segurança | Situação |
| --- | --- | --- | --- |
| Início / leilões | Explorar produtos, estados e detalhes | Abrir a vitrine e um leilão cadastrado | Interface implementada; fluxos visuais homologados |
| Cadastro e login | Identificar o usuário | Criar/entrar em conta no ambiente local | Fluxo local homologado |
| Minha carteira | Consultar saldo e movimentações | Acessar após login | Consulta local homologada; pagamentos reais não liberados |
| Depósitos PIX | Registrar e acompanhar depósitos | Somente ambiente isolado e testes automatizados | Backend com testes; operação pública pendente |
| Detalhes do leilão | Acompanhar preço, status e cronômetro | Abrir `/auctions/registered/[id]` | SSE, polling e interface demonstrados |
| Prévia de lance | Entender requisitos e custo de participação | Abrir modal informativa, sem confirmar envio | Somente informativa; POST financeiro desabilitado |
| Simulador | Visualizar incremento hipotético | Abrir ferramentas de suporte e simular | Simulação local, não altera saldo nem leilão |
| Consultar tentativa | Investigar uma chave UUID v4 | Entrar na conta, abrir ferramentas de suporte e consultar | GET autenticado; chave inexistente homologada na interface |
| Recuperação de tentativa | Evitar duplicidade após falha de rede | Testes e laboratório `/auctions/demo-recovery` | Lógica e laboratório homologados; sem lance financeiro real |
| Ganhadores | Ver leilões concluídos e vencedores | Abrir página de ganhadores | Interface implementada e revisada |
| Histórico e entregas | Consultar vitórias e informar endereço | Usar páginas da conta no ambiente de testes | Endpoints testados; verificar cada fluxo antes de produção |
| Administração | Gerenciar produtos, leilões e operações | Somente com conta autorizada em ambiente de testes | Telas e endpoints em desenvolvimento; revisar permissões |

## 3. Tutorial: consultar uma tentativa de lance

1. Inicie MongoDB, API e frontend seguindo a seção 5.
2. Faça login e abra um leilão cadastrado.
3. Expanda **Ferramentas de demonstração e suporte**.
4. Em **Consultar tentativa de lance**, informe uma chave UUID v4. Uma chave fictícia usada nos testes é `123e4567-e89b-42d3-a456-426614174000`.
5. Clique em **Consultar registro**. A consulta usa GET e exige autenticação; não realiza cobrança.
6. Se aparecer **registro não encontrado**, isso **não autoriza reenviar** uma tentativa financeira.
7. Clique em **Limpar consulta** para remover o resultado exibido. A limpeza visual não é exclusão de lance no banco. **Homologado em 2026-11-12:** capturas antes/depois confirmaram campo vazio, remoção do resultado no formulário e da seção de última consulta no monitor, mantendo “Nenhuma tentativa em andamento”.

**Falha de conexão homologada em 2026-11-12:** com a API temporariamente parada, a interface exibiu “Consulta indisponível”, manteve a chave preenchida e orientou a consultar mais tarde, sem confundir indisponibilidade com 404. **Recuperação homologada:** após reiniciar a API na porta 3001, a mesma página (sem F5) voltou a consultar a chave fictícia e mostrou registro não encontrado, sem liberar novo envio.

O monitor distingue a consulta manual de uma tentativa realmente iniciada pela página. A recuperação de uma tentativa pendente só pode ser confirmada se a chave, a conta e o leilão corresponderem ao registro retornado. Respostas atrasadas após troca de conta, token, leilão ou consulta são ignoradas.

## 4. Como o sistema evita cobranças duplicadas

- **Idempotência:** cada tentativa financeira usa uma chave UUID v4; uma resposta perdida não deve resultar em novo POST com chave diferente.
- **Transações no backend:** débito da carteira, registro do lance, atualização do leilão e lançamento contábil devem permanecer consistentes.
- **Reconciliação:** consultar por GET a chave original antes de qualquer decisão após timeout ou resultado incerto. Respostas com identidade ou estrutura inválida devem manter a tentativa incerta, sem confirmação nem limpeza do diário.
- **Diário de sessão:** um registro pendente pode sobreviver ao F5 na mesma aba via `sessionStorage`. Isso não garante recuperação após fechamento da aba ou perda dos dados do navegador.
- **Limpeza segura:** o diário só pode ser removido após confirmação compatível com conta, leilão e chave.
- **Bloqueio de lançamento:** `AUCTION_BIDDING_ENABLED=false` na API e a interface de prévia não permitem lances financeiros nesta fase.

Os testes unitários e de integração controlada não substituem uma homologação financeira real ou uma auditoria de produção.

## 5. Tutorial: iniciar o ambiente local no Windows (Git Bash)

Use **quatro terminais separados**. Não inicie dois Next.js simultaneamente: a segunda instância pode ocupar a porta reservada à API.

**Terminal 1 — MongoDB 8.2, replica set de testes:**

```bash
"/c/Program Files/MongoDB/Server/8.2/bin/mongod.exe" --replSet walletTestRS --port 27018 --dbpath "C:/data/wallet-test" --bind_ip 127.0.0.1
```

O caminho acima corresponde ao ambiente local verificado em 2026-11-12. **Não executar `rs.initiate()` nem apagar dados** ao retomar o replica set existente.

**Terminal 2 — API:**

```bash
cd /c/Users/johael/Desktop/showDeCentavos/showDeCentavos.api
export MONGO_URI="mongodb://127.0.0.1:27018/wallet_test_pix?replicaSet=walletTestRS"
export AUCTION_BIDDING_ENABLED=false
export PORT=3001
npm run dev
```

**Terminal 3 — Frontend:**

```bash
cd /c/Users/johael/Desktop/showDeCentavos/showDeCentavos.app
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api npm run dev
```

**Terminal 4 — Consultas e testes:**

```bash
curl -i http://127.0.0.1:3001/api/auctions/bids/by-key/123e4567-e89b-42d3-a456-426614174000
```

Sem token, o resultado esperado é **401 Unauthorized**, o que confirma que a rota está protegida. A página local fica em `http://localhost:3000`. Se o Next.js anunciar que a porta 3000 já está ocupada, **não inicie outra instância na 3001**; interrompa a duplicada e mantenha a API nessa porta.

## 6. Arquitetura e onde estudar o código

- `app/`: rotas do Next.js.
- `components/auctions/RegisteredAuctionDetail.tsx`: detalhe do leilão, modal, simulador e consultas de suporte.
- `services/bids.ts`: GET de consulta, validação de registros e POST financeiro bloqueado por padrão.
- `services/bidPreflight.ts`: avaliação informativa de elegibilidade.
- `services/bidAttemptState.ts`: estados da tentativa.
- `services/bidAttemptJournal.ts`: persistência, recuperação e limpeza do diário.
- `services/bidAttemptReconciliation.ts`: verificação da correspondência do lance retornado.
- `services/bidLookupGuard.ts`: proteção contra respostas GET antigas.
- `tests/`: testes de regras de negócio e segurança.
- API em repositório separado: controllers, models, transações, carteira e eventos SSE.

## 7. O que ainda precisa ser explicado e validado

Este é o primeiro capítulo do manual. Os próximos capítulos devem detalhar **cada tela e endpoint**, incluindo campos, permissões, regras, mensagens de erro, exemplos de uso e testes. Em particular: administração de produtos/leilões, depósitos PIX, conciliação financeira, histórico, vitórias, entrega e incidentes. Confirmar cada capítulo no código atual antes de marcá-lo como completo.

**Regra de manutenção:** ao concluir uma funcionalidade, atualizar este guia (ou um tutorial específico em `docs/`) e registrar a homologação em `DEVELOPMENT_STATUS.md`. Nunca descrever como liberado algo apenas implementado ou testado em laboratório.
