'use client';
import { CreditCard, History, RefreshCw, ShieldCheck } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { money } from '@/utils/format';
const typeLabels = { deposit: 'Recarga', bid: 'Lance', refund: 'Estorno', adjustment: 'Ajuste' };
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export function WalletCards() {
  const { balanceCents, transactions, page, totalPages, totalTransactions, isLoading, error, refresh, changePage } = useWallet();
  return <div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
      <button type="button" className="btn-secondary" onClick={() => void refresh()} disabled={isLoading}><RefreshCw size={16}/> Atualizar carteira</button>
    </div>
    {error && <p className="notice" role="alert">{error} <button type="button" onClick={() => void refresh()} style={{ textDecoration: 'underline' }}>Tentar novamente</button></p>}
    <div className="steps">
      <div className="panel"><CreditCard color="#ff6a32"/><h3>Saldo disponível</h3>
        <div className="detail-price">{isLoading && balanceCents === null ? 'Carregando...' : balanceCents === null ? 'Indisponível' : money(balanceCents)}</div>
        <p className="retail">Saldo consultado na API. {isLoading ? 'Atualizando...' : ''}</p>
      </div>
      <div className="panel"><History color="#ff6a32"/><h3>Movimentações</h3>
        <p>{isLoading ? 'Carregando histórico...' : totalTransactions === 0 ? 'Nenhuma movimentação registrada.' : `${totalTransactions} movimentação(ões) registrada(s).`}</p>
      </div>
      <div className="panel"><ShieldCheck color="#ff6a32"/><h3>Recarga PIX</h3>
        <p>Recargas permanecem desativadas até a conclusão dos testes e da validação jurídica.</p>
        <button type="button" className="btn-secondary" disabled>Recarregar (em breve)</button>
      </div>
    </div>
    <section className="panel" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 22, marginTop: 0 }}>Histórico financeiro</h2>
      {transactions.length === 0 ? <p style={{ color: '#7d8392' }}>{isLoading ? 'Buscando movimentações...' : error ? 'Não foi possível carregar o histórico.' : 'Ainda não há movimentações nesta carteira.'}</p> :
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr><th style={{ padding: 12 }}>Data</th><th style={{ padding: 12 }}>Tipo</th><th style={{ padding: 12 }}>Descrição</th><th style={{ padding: 12 }}>Valor</th><th style={{ padding: 12 }}>Saldo após</th></tr></thead>
          <tbody>{transactions.map((tx) => <tr key={tx._id} style={{ borderTop: '1px solid #edf0f5' }}>
            <td style={{ padding: 12, whiteSpace: 'nowrap' }}>{dateFormat.format(new Date(tx.createdAt))}</td>
            <td style={{ padding: 12 }}>{typeLabels[tx.type] ?? tx.type}</td>
            <td style={{ padding: 12 }}>{tx.description || '—'}</td>
            <td style={{ padding: 12, fontWeight: 800, color: tx.amountCents >= 0 ? '#24734e' : '#c5473b' }}>{tx.amountCents > 0 ? '+' : ''}{money(tx.amountCents)}</td>
            <td style={{ padding: 12 }}>{money(tx.balanceAfterCents)}</td>
          </tr>)}</tbody>
        </table></div>}
      {totalPages > 1 && <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20 }}>
        <button className="btn-secondary" type="button" disabled={isLoading || page <= 1} onClick={() => void changePage(page - 1)}>Anterior</button>
        <span>Página {page} de {totalPages}</span>
        <button className="btn-secondary" type="button" disabled={isLoading || page >= totalPages} onClick={() => void changePage(page + 1)}>Próxima</button>
      </div>}
    </section>
  </div>;
}
