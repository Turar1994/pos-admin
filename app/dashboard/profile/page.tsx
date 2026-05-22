'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AdminProfilePage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passSuccess, setPassSuccess] = useState('')
  const [passError, setPassError] = useState('')

  useEffect(() => { loadAdmin() }, [])

  async function loadAdmin() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setEmail(session.user.email || '')
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    if (data) {
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true); setSuccess('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('profiles').upsert({ id: session.user.id, full_name: fullName, phone })
    setSaving(false)
    setSuccess('Сақталды!')
    setTimeout(() => setSuccess(''), 3000)
  }

  async function changePassword() {
    if (!newPassword || !newPassword2) { setPassError('Барлық өрісті толтырыңыз'); return }
    if (newPassword !== newPassword2) { setPassError('Парольдер сәйкес емес'); return }
    if (newPassword.length < 6) { setPassError('Кемінде 6 таңба'); return }
    setPassLoading(true); setPassError(''); setPassSuccess('')
    const { error } = await createClient().auth.updateUser({ password: newPassword })
    if (error) { setPassError(error.message); setPassLoading(false); return }
    setNewPassword(''); setNewPassword2('')
    setPassLoading(false)
    setPassSuccess('Пароль өзгертілді!')
    setTimeout(() => setPassSuccess(''), 3000)
  }

  if (loading) return <p style={{ color: '#6b7280' }}>Жүктелуде...</p>

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Жеке кабинет</h1>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Профиль</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>Email</label>
            <input value={email} disabled style={{ background: '#f9fafb', color: '#6b7280' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>Аты-жөні</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Аты-жөніңіз" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>Телефон</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7..." />
          </div>
          {success && <p style={{ color: '#0F6E56', fontSize: 13 }}>✓ {success}</p>}
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ width: 'auto' }}>
            {saving ? 'Сақталуда...' : 'Сақтау'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Пароль өзгерту</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="password" placeholder="Жаңа пароль" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <input type="password" placeholder="Жаңа паролді қайталаңыз" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} />
          {passError && <p style={{ color: '#D85A30', fontSize: 13 }}>{passError}</p>}
          {passSuccess && <p style={{ color: '#0F6E56', fontSize: 13 }}>✓ {passSuccess}</p>}
          <button className="btn btn-primary" onClick={changePassword} disabled={passLoading} style={{ width: 'auto' }}>
            {passLoading ? 'Өзгертілуде...' : 'Паролді өзгерту'}
          </button>
        </div>
      </div>
    </div>
  )
}
