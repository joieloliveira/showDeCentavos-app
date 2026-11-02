'use client';
import Link from 'next/link';
import { MyParticipations } from './MyParticipations';
import { useState } from 'react';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';
import { ArrowRight, CircleUserRound, Gavel, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
export function AccountDashboard() {
  const { user, isLoading, getToken, refreshUser } = useAuth();
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [nameMessage, setNameMessage] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const saveName = async () => {
    const name = (nameInput ?? user?.name ?? '').trim();
    if (name.length < 2 || name.length > 100) { setNameMessage('Informe um nome entre 2 e 100 caracteres.'); return; }
    const token = getToken();
    if (!token) { setNameMessage('Faça login novamente.'); return; }
    setNameSaving(true); setNameMessage('');
    try {
      await api.patch('/auth/me/name', { name }, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUser();
      setNameMessage('Nome atualizado!');
    } catch (error) { setNameMessage(getApiError(error)); }
    finally { setNameSaving(false); }
  };
  const savePassword = async () => {
    if (newPassword.length < 8 || newPassword.length > 128) { setPasswordMessage('A nova senha deve ter entre 8 e 128 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage('As novas senhas não conferem.'); return; }
    const token = getToken();
    if (!token) { setPasswordMessage('Faça login novamente.'); return; }
    setPasswordSaving(true); setPasswordMessage('');
    try {
      await api.post('/auth/me/change-password', { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPasswordMessage('Senha alterada com sucesso!');
    } catch (error) { setPasswordMessage(getApiError(error)); }
    finally { setPasswordSaving(false); }
  };
  const saveNickname = async () => {
    const value = (nickname ?? user?.publicNickname ?? '').trim();
    if (!/^[A-Za-z0-9_]{3,30}$/.test(value)) { setNicknameMessage('Use 3 a 30 letras, números ou _.'); return; }
    const token = getToken();
    if (!token) { setNicknameMessage('Faça login novamente.'); return; }
    setSaving(true);
    try {
      await api.put('/users/me/public-nickname', { publicNickname: value }, { headers: { Authorization: `Bearer ${token}` } });
      setNickname(value);
      try {
        await refreshUser();
        setNicknameMessage('Apelido salvo!');
      } catch {
        setNicknameMessage('Apelido salvo. Atualize a página para sincronizar o perfil.');
      }
    } catch (error) { setNicknameMessage(getApiError(error)); }
    finally { setSaving(false); }
  };
  if (isLoading) return <div className="panel" role="status">Verificando sua sessão...</div>;
  if (!user) return <div className="panel account-login-prompt"><CircleUserRound size={35}/><h2>Entre para acessar seu painel</h2><p>Consulte sua carteira e acompanhe as novidades do Show de Centavos em um só lugar.</p><Link className="btn-primary" href="/login?next=/account">Fazer login <ArrowRight size={17}/></Link></div>;
  return <>
    <div className="account-welcome"><span className="eyebrow">Área do usuário</span><h1>Olá, {user.name}!</h1><p>Este é seu espaço para acompanhar sua conta e acessar os recursos da plataforma.</p></div>
    <div className="account-summary-grid">
      <Link href="/wallet" className="account-summary-card"><span className="account-summary-icon"><Wallet/></span><strong>Minha carteira</strong><p>Consulte seu saldo, depósitos PIX e histórico de movimentações.</p><span className="account-summary-action">Acessar carteira <ArrowRight size={16}/></span></Link>
      <a href="#my-participations" className="account-summary-card"><span className="account-summary-icon"><Gavel/></span><strong>Minhas participações</strong><p>Consulte seu histórico de lances, os valores utilizados e os leilões que venceu.</p><span className="account-summary-action">Ver minhas participações <ArrowRight size={16}/></span></a>
      <Link href="/auctions" className="account-summary-card"><span className="account-summary-icon"><ShieldCheck/></span><strong>Explorar leilões</strong><p>Conheça os produtos e consulte as condições das disputas demonstrativas.</p><span className="account-summary-action">Ver leilões <ArrowRight size={16}/></span></Link>
    </div>
    <section className="account-details"><div><span className="eyebrow">Dados da conta</span><h2>Meu perfil</h2><p>Informações vinculadas à sua sessão autenticada.</p></div><dl><div><dt>Nome</dt><dd>{user.name}</dd></div><div><dt>E-mail</dt><dd>{user.email}</dd></div><div><dt>Tipo de conta</dt><dd>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</dd></div></dl></section>
    <section className="account-details"><div><span className="eyebrow">Dados pessoais</span><h2>Alterar meu nome</h2><p>Atualize o nome da sua conta sem modificar o apelido público.</p></div><div className="field"><label htmlFor="account-name">Nome</label><input id="account-name" type="text" minLength={2} maxLength={100} value={nameInput ?? user.name} onChange={e => { setNameInput(e.target.value); setNameMessage(''); }} /><button type="button" className="btn-primary" disabled={nameSaving} onClick={() => void saveName()}>{nameSaving ? 'Salvando...' : 'Salvar nome'}</button><p role="status">{nameMessage}</p></div></section>
    <section className="account-details"><div><span className="eyebrow">Segurança</span><h2>Alterar minha senha</h2><p>Informe sua senha atual para definir uma nova. Contas Google sem senha podem utilizar a recuperação por e-mail.</p></div><div className="field"><label htmlFor="current-password">Senha atual</label><input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /><label htmlFor="new-password">Nova senha</label><input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /><label htmlFor="confirm-password">Confirme a nova senha</label><input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /><button type="button" className="btn-primary" disabled={passwordSaving} onClick={() => void savePassword()}>{passwordSaving ? 'Salvando...' : 'Alterar senha'}</button><p role="status">{passwordMessage}</p></div></section>
    <section className="account-details"><div><span className="eyebrow">Identificação pública</span><h2>Meu apelido nos leilões</h2><p>Seu apelido será exibido se você vencer um leilão. Seu nome e e-mail não serão divulgados.</p></div><div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px", minWidth: 0 }}><label htmlFor="public-nickname" style={{ display: "block", fontWeight: 600 }}>Apelido público</label><input id="public-nickname" type="text" style={{ width: "100%", maxWidth: "340px", minHeight: "42px", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", color: "#111827" }} maxLength={30} autoComplete="off" value={nickname ?? user.publicNickname ?? ""} onChange={event => { setNickname(event.target.value); setNicknameMessage(""); }} placeholder="Ex.: JoielDev" /><button type="button" className="btn-primary" disabled={saving} onClick={() => void saveNickname()}>{saving ? "Salvando..." : "Salvar apelido"}</button><p role="status">{nicknameMessage}</p></div></section>
    <MyParticipations />
    <div className="account-safety-note"><ShieldCheck size={19}/><span>Os leilões apresentados atualmente são demonstrativos. Não é possível realizar lances reais nesta versão.</span></div>
  </>;
}
