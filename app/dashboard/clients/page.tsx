'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type Client = {
  id: string
  store_name: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'blocked'
  subscription_end: string | null
  notes: string
  created_at: string
}

const emptyForm = {
  store_name: '', email: '', phone: '',
  status: 'active', subscription_end: '', notes: ''
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const loadClients = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function addClient() {
    if (!form.store_name || !form.email) return
    const supabase = createClient()
    await supabase.from('clients').insert({
      store_name: form.store_name, email: form.email,
      phone: form.phone, status: form.status,
      subscription_end: form.subscription_end || null,
      notes: form.notes,
    })
    setForm({ ...emptyForm })
    setShowAdd(false)
    loadClients()
  }

  async function updateClient() {
    if (!editId) return
    const supabase = createClient()
    await supabase.from('clients').update({
      store_name: form.store_name, email: form.email,
      phone: form.phone, status: form.status,
      subscription_end: form.subscription_end || null,
      notes: form.notes,
    }).eq('id', editId)
    setEditId(null)
    setForm({ ...emptyForm })
    loadClients()
  }

  async function deleteClient(id: string) {
    if (!confirm('Клиентті жоюға сенімдісіз бе?')) return
    await createClient().from('clients').delete().eq('id', id)
    loadClients()
  }

  async function toggleStatus(client: Client) {
    const newStatus = client.status === 'active' ? 'blocked' : 'active'
    await createClient().from('clients').update({ status: newStatus }).eq('id', client.id)
    loadClients()
  }

  function startEdit(c: Client) {
    setEditId(c.id)
    setForm({
      store_name: c.store_name, email: c.email,
      phone: c.phone || '', status: c.status,
      subscription_end: c.subscription_end || '',
      notes: c.notes || ''
    })
    setShowAdd(false)
  }

  function cancelForm() {
    setShowAdd(false)
    setEditId(null)
    setForm({ ...emptyForm })
  }

  function isExpiringSoon(date: string | null) {
    if (!date) return false
    const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff <= 7 && diff >= 0
  }

  function isExpired(date: string | null) {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const filtered = clients.filter(c => {
    const matchSearch = c.store_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const isFormOpen = showAdd || !!editId

  if (loading) return <p style={{ color: '#6b7280' }}>Жүктелуде...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Клиенттер ({clients.length})</h1>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setEditId(null); setForm({ ...emptyForm }) }}>
          + Клиент қосу
        </button>
      </div>

      {isFormOpen && (
        <div className="card" style={{ border: '2px solid #185FA5', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            {editId ? '✏️ Клиентті өзгерту' : '➕ Жаңа клиент қосу'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input
              placeholder="Дүкен аты *"
              value={form.store_name}
              onChange={e => updateForm('store_name', e.target.value)}
            />
            <input
              placeholder="Email *"
              value={form.email}
              onChange={e => updateForm('email', e.target.value)}
            />
            <input
              placeholder="Телефон"
              value={form.phone}
              onChange={e => updateForm('phone', e.target.value)}
            />
            <select value={form.status} onChange={e => updateForm('status', e.target.value)}>
              <option value="active">✅ Белсенді</option>
              <option value="inactive">⏸ Белсенді емес</option>
              <option value="blocked">🚫 Блокталған</option>
            </select>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                Подписка мерзімі
              </label>
              <input
                type="date"
                value={form.subscription_end}
                onChange={e => updateForm('subscription_end', e.target.value)}
              />
            </div>
            <input
              placeholder="Ескертпе"
              value={form.notes}
              onChange={e => updateForm('notes', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={editId ? updateClient : addClient}>
              {editId ? 'Сақтау' : 'Қосу'}
            </button>
            <button className="btn" onClick={cancelForm}>Болдырмау</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          placeholder="🔍 Іздеу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 180 }}>
          <option value="all">Барлығы</option>
          <option value="active">✅ Белсенді</option>
          <option value="inactive">⏸ Белсенді емес</option>
          <option value="blocked">🚫 Блокталған</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Дүкен аты</th>
              <th>Email / Телефон</th>
              <th>Статус</th>
              <th>Подписка</th>
              <th>Ескертпе</th>
              <th>Әрекет</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>
                  Клиент жоқ
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.store_name || '—'}</td>
                <td>
                  <div>{c.email}</div>
                  {c.phone && <div style={{ fontSize: 12, color: '#6b7280' }}>{c.phone}</div>}
                </td>
                <td>
                  <span className={`badge badge-${c.status}`}>
                    {c.status === 'active' ? '✅ Белсенді' : c.status === 'blocked' ? '🚫 Блок' : '⏸ Белсенді емес'}
                  </span>
                </td>
                <td>
                  {c.subscription_end ? (
                    <span style={{
                      color: isExpired(c.subscription_end) ? '#D85A30' : isExpiringSoon(c.subscription_end) ? '#D97706' : '#0F6E56',
                      fontSize: 13
                    }}>
                      {isExpired(c.subscription_end) ? '❌ ' : isExpiringSoon(c.subscription_end) ? '⚠️ ' : '✓ '}
                      {new Date(c.subscription_end).toLocaleDateString('kk-KZ')}
                    </span>
                  ) : <span className="text-muted">—</span>}
                </td>
                <td style={{ maxWidth: 150, fontSize: 13, color: '#6b7280' }}>{c.notes || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => startEdit(c)}>✏️</button>
                    <button
                      className={`btn btn-sm ${c.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleStatus(c)}
                    >
                      {c.status === 'active' ? '🚫' : '✅'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteClient(c.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
