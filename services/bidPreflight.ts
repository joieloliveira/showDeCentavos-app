/** Informational checks only. Never authorizes a financial POST. */
export type BidPreflightInput = {
  authenticated: boolean;
  authenticationPending: boolean;
  auctionStatus: string;
  serverAvailable: boolean;
  balanceCents: number | null;
  bidCostCents: number;
};

export type BidPreflight = { readyForPreview: boolean; message: string };

export function evaluateBidPreflight(input: BidPreflightInput): BidPreflight {
  if (input.authenticationPending) return { readyForPreview: false, message: 'Verificando autenticação...' };
  if (!input.authenticated) return { readyForPreview: false, message: 'Pré-requisito: entrar na conta.' };
  if (input.auctionStatus !== 'active') return { readyForPreview: false, message: 'Pré-requisito: aguardar o leilão ficar ativo.' };
  if (!input.serverAvailable) return { readyForPreview: false, message: 'Pré-requisito: restabelecer a comunicação com o servidor.' };
  if (input.balanceCents === null || !Number.isSafeInteger(input.balanceCents) || input.balanceCents < 0) {
    return { readyForPreview: false, message: 'Pré-requisito: confirmar o saldo da carteira.' };
  }
  if (!Number.isSafeInteger(input.bidCostCents) || input.bidCostCents <= 0) {
    return { readyForPreview: false, message: 'Pré-requisito: confirmar o custo do lance.' };
  }
  if (input.balanceCents < input.bidCostCents) return { readyForPreview: false, message: 'Pré-requisito: saldo suficiente para um lance.' };
  return { readyForPreview: true, message: 'Pré-requisitos básicos atendidos. O envio financeiro continua bloqueado.' };
}
