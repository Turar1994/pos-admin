'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Recovery token өңдеу
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const supabase = createClient()
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) router.replace('/dashboard')
      })
    }
  }, [router])
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Барлық өрісті толтырыңыз'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email немесе пароль қате'); setLoading(false); return }
    if (data.session?.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      await supabase.auth.signOut()
      setError('Рұқсат жоқ — тек админ кіре алады')
      setLoading(false); return
    }
    router.replace('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ width: 380, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>BazarLine</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Админ панель</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <p style={{ color: '#D85A30', fontSize: 13 }}>{error}</p>}
          <button className="btn btn-primary" onClick={handleLogin} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Кіруде...' : 'Кіру'}
          </button>
        </div>
      </div>
    </div>
  )
}
