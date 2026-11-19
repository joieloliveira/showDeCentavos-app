# Show de Centavos — instruções para agentes (frontend)

Leia este arquivo antes de editar. Fonte de verdade: código da branch atual + testes; documentação pode estar desatualizada.

## Continuidade obrigatória
1. Confira a branch `feature/frontend-initial` e o estado do Git; nunca altere `main` sem autorização.
2. Leia `docs/PROJECT_CONTEXT.md`, `docs/DEVELOPMENT_STATUS.md` e `docs/GUIA_FUNCIONAL.md`; consulte os arquivos de implementação relevantes.
3. Consulte também o repositório irmão `joieloliveira/showDeCentavos-api`, branch `feature/wallet-pix-deposits`, quando houver dependência de API.
4. Diferencie sempre **implementado**, **testado automaticamente**, **homologado no navegador** e **pendente**. Não invente resultados.
5. Ao terminar, atualize documentação e registre arquivos, commits, testes executados e pendências.

## Segurança inegociável
- **Não habilitar lances financeiros**: manter `AUCTION_BIDDING_ENABLED=false` na API e o bloqueio de POST no frontend, salvo autorização explícita do responsável.
- Não enviar lances reais, depósitos, alterações de saldo ou migrações destrutivas como teste.
- Preservar idempotência UUID v4, reconciliação somente GET, journal de tentativa incerta, proteção contra resposta antiga e validação de conta/leilão.
- Nunca interpretar GET 404 ou falha de rede como autorização automática para reenviar lance.
- Não inserir credenciais, tokens, segredos ou dados privados nos arquivos de contexto.

## Trabalho
- Stack: Next.js App Router, React, TypeScript; API Node.js/Express/MongoDB em repositório separado.
- Priorizar mudanças pequenas e verificáveis; evitar refatorações não solicitadas.
- Executar apenas testes relevantes para a alteração e `npm run typecheck`; relatar quando não puder executar.
- O usuário valida localmente no Windows/Git Bash; não afirmar que passou antes de receber saída.
- Documentar funcionalidades e como operá-las em `docs/GUIA_FUNCIONAL.md`.
- Codex ou qualquer agente deve respeitar essas regras; este arquivo não concede autorização para deploy ou operações financeiras.
