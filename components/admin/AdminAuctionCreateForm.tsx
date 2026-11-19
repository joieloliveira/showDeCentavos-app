'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createAdminAuction, listAuctionProducts, type AuctionProduct } from '@/services/adminAuctions';
import { getApiError } from '@/services/auth';

export function AdminAuctionCreateForm({ onCreated }: { onCreated: () => void }) {
  const { getToken, user } = useAuth();
  const [products, setProducts] = useState<AuctionProduct[]>([]);
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('0');
  const [cost, setCost] = useState(50);
  const [busy, setBusy] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [message, setMessage] = useState('');
  const priceCents = Number(price);
  const priceIsValid = price.trim() !== '' && Number.isSafeInteger(priceCents) && priceCents >= 0;

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const token = getToken();
    if (!token) return;

    let active = true;
    setLoadingProducts(true);
    setProductsError('');
    listAuctionProducts(token)
      .then(items => { if (active) setProducts(items); })
      .catch(error => { if (active) setProductsError(getApiError(error)); })
      .finally(() => { if (active) setLoadingProducts(false); });
    return () => { active = false; };
  }, [user?.role, getToken]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || loadingProducts || productsError || !priceIsValid || !products.some(item => item._id === product)) return;

    const token = getToken();
    if (!token || user?.role !== 'admin') {
      setMessage('Sua sessão de administrador não está disponível. Faça login novamente.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      await createAdminAuction(token, product, priceCents, cost);
      setMessage('Leilão cadastrado sem iniciar.');
      setProduct('');
      onCreated();
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel admin-auction-panel">
      <h2>Cadastrar leilão</h2>
      <p>O cadastro não inicia a espera ou o cronômetro.</p>
      <form onSubmit={save}>
        <div className="admin-auction-create-fields">
          <label>
            Produto
            <select required value={product} disabled={busy || loadingProducts || Boolean(productsError)} onChange={event => setProduct(event.target.value)}>
              <option value="">Selecione um produto</option>
              {products.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </label>
          <label>
            Preço inicial em centavos
            <input type="number" min="0" step="1" required value={price} disabled={busy}
              aria-invalid={!priceIsValid} aria-describedby={priceIsValid ? undefined : 'admin-auction-price-error'}
              onChange={event => setPrice(event.target.value)} />
          </label>
          <label>
            Custo do lance
            <select value={cost} disabled={busy} onChange={event => setCost(Number(event.target.value))}>
              <option value={50}>R$ 0,50</option>
              <option value={100}>R$ 1,00</option>
            </select>
          </label>
        </div>
        {!priceIsValid && <p id="admin-auction-price-error">Informe um valor inteiro em centavos, igual ou maior que zero.</p>}
        {loadingProducts && <p role="status">Carregando produtos ativos...</p>}
        {productsError && <p role="alert">Falha ao carregar produtos. {productsError}</p>}
        {!loadingProducts && !productsError && products.length === 0 && <p>Nenhum produto ativo disponível para seleção.</p>}
        <button type="submit" className="incident-action" disabled={busy || loadingProducts || Boolean(productsError) || !product || !priceIsValid}>
          {busy ? 'Cadastrando...' : 'Cadastrar sem iniciar'}
        </button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
