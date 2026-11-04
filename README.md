# Show de Centavos — Frontend

Frontend Next.js App Router com TypeScript, Tailwind CSS, Axios, React Context API, React Hook Form e Zod.

## Instalação

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000.

## Estrutura

- `app/`: rotas e layouts
- `components/`: interface e formulários
- `contexts/`: estados globais (Auth, Wallet, DataSite)
- `schemas/`: validação com Zod
- `services/`: cliente HTTP Axios
- `types/`, `utils/`, `data/`: domínio e funções auxiliares

## Segurança

Este frontend é um **protótipo**: os leilões são dados fictícios e os botões financeiros estão desabilitados. Não existe integração de autenticação, lances, pagamentos ou temporizadores reais nesta fase. O backend precisará disponibilizar regras de autorização, saldo, lances e tempo oficial antes de habilitar essas funções. Revisão jurídica também é obrigatória antes de qualquer lançamento comercial.

A identidade visual é original; sites externos são referências de funcionamento, não uma reprodução de seus ativos ou textos.
