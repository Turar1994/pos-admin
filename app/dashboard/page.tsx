'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Stats = { total: number; active: number; inactive: number; blocked: number }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, blocked: 0 })
  const [recentClients, setRecentClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: clients } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (clients) {
      setStats({
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        inactive: clients.filter(c => c.status === 'inactive').length,
        blocked: clients.filter(c => c.status === 'blocked').length,
      })
      setRecentClients(clients.slice(0, 5))
    }
    setLoading(false)
  }

  const statCards = [
    { label: 'Барлық клиент', value: stats.total, color: '#185FA5' },
    { label: 'Белсенді (төледі)', value: stats.active, color: '#0F6E56' },
    { label: 'Белсенді емес', value: stats.inactive, color: '#D97706' },
    { label: 'Блокталған', value: stats.blocked, color: '#D85A30' },
  ]

  if (loading) return <p style={{ color: '#6b7280' }}>Жүктелуде...</p>

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Басты бет</h1>

      <div className="stat-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Соңғы клиенттер</h2>
        {recentClients.length === 0 ? (
          <p className="text-muted">Клиент жоқ</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Дүкен аты</th>
                <th>Email</th>
                <th>Статус</th>
                <th>Подписка</th>
                <th>Тіркелген</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.store_name}</td>
                  <td className="text-muted">{c.email}</td>
                  <td>
                    <span className={`badge badge-${c.status}`}>
                      {c.status === 'active' ? '✅ Белсенді' : c.status === 'blocked' ? '🚫 Блок' : '⏸ Белсенді емес'}
                    </span>
                  </td>
                  <td className="text-muted">{c.subscription_end ? new Date(c.subscription_end).toLocaleDateString('kk-KZ') : '—'}</td>
                  <td className="text-muted">{new Date(c.created_at).toLocaleDateString('kk-KZ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
