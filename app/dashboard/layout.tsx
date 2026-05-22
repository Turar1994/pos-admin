'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    createClient().auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const { data: profile } = await createClient().from('profiles').select('full_name').eq('id', data.session.user.id).maybeSingle()
      if (profile?.full_name) setAdminName(profile.full_name)
      else setAdminName(data.session.user.email || '')
      setChecking(false)
    })
  }, [router])

  async function logout() {
    await createClient().auth.signOut()
    router.replace('/login')
  }

  if (checking) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: '#6b7280' }}>Жүктелуде...</p>
    </div>
  )

  const navItems = [
    { path: '/dashboard', label: '📊 Басты бет' },
    { path: '/dashboard/clients', label: '👥 Клиенттер' },
    { path: '/dashboard/profile', label: '👤 Жеке кабинет' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#111', color: '#fff',
        display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>BazarLine</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Админ панель</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map(item => (
            <button key={item.path} onClick={() => router.push(item.path)} style={{
              width: '100%', textAlign: 'left', padding: '10px 20px',
              background: pathname === item.path ? '#185FA5' : 'transparent',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14,
              borderLeft: pathname === item.path ? '3px solid #60a5fa' : '3px solid transparent'
            }}>{item.label}</button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #333' }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {adminName}
          </div>
          <button onClick={logout} style={{
            width: '100%', padding: '8px 12px', background: '#333',
            color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13
          }}>🚪 Шығу</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>{children}</main>
    </div>
  )
}
