# Show de Centavos — Frontend

Aplicação Next.js (App Router), React e TypeScript para a plataforma Show de Centavos. **Em desenvolvimento e homologação; não está autorizada para operação financeira pública.**

## Tecnologias
- Next.js 15, React 19, TypeScript, Tailwind CSS
- Axios, React Context API, React Hook Form e Zod
- API separada em Node.js/Express e MongoDB/Mongoose

## Módulos existentes no código
- Vitrine e detalhes de leilões, com status, contagem regressiva, integração SSE e atualização periódica de segurança
- Cadastro, login, recuperação de senha e área da conta
- Carteira, fluxo de depósitos PIX e acompanhamento
- Histórico de participações e vitórias, endereço de entrega e prévias de pagamento do ganhador
- Administração de produtos, leilões, operações de entrega, monitoramento PIX e incidentes financeiros

**Existir no código não equivale a aprovação para produção.** A situação de testes, homologações e pendências está documentada em [docs/DEVELOPMENT_STATUS.md](docs/DEVELOPMENT_STATUS.md).

## Execução local
A instalação inicial exige `npm install`. Para iniciar o frontend após instalar as dependências:

```bash
npm run dev
```

O frontend usa `NEXT_PUBLIC_API_URL` para apontar à API. Exemplo **somente para homologação isolada** no Git Bash:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:3002/api npm run dev
```

O script demonstrativo da API roda na porta 3002 com MongoDB local de testes; consulte o documento de continuidade antes de iniciar o ambiente. **Não utilizar banco de produção na demonstração.**

## Verificações
```bash
npm run typecheck
npm run lint
npm run build
```

## Organização
- `app/`: páginas e rotas
- `components/`: interface e formulários
- `contexts/`: estados globais
- `services/`: integração com API
- `schemas/`: validação
- `docs/DEVELOPMENT_STATUS.md`: estado do projeto e retomada entre conversas

## Segurança e lançamento
Lances financeiros devem permanecer desativados durante a homologação, até revisão técnica e autorização explícita. Pagamentos, concorrência, autorização, observabilidade e obrigações jurídicas/publicitárias exigem validação antes de qualquer lançamento comercial.
