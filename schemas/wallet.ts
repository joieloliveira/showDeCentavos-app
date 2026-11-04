import { z } from 'zod';
export const pixDepositSchema = z.object({
  amount: z.string().trim().min(1, 'Informe o valor da recarga').refine((value) => /^\d+(?:[.,]\d{1,2})?$/.test(value), 'Informe um valor válido, como 10,00').refine((value) => {
    const cents = Math.round(Number(value.replace(',', '.')) * 100);
    return Number.isSafeInteger(cents) && cents >= 100 && cents <= 100000;
  }, 'A recarga deve ser de R$ 1,00 a R$ 1.000,00'),
});
export type PixDepositFormValues = z.infer<typeof pixDepositSchema>;
export function amountToCents(value: string) { return Math.round(Number(value.replace(',', '.')) * 100); }
