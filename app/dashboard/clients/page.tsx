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
  deleted_at: string | null
  full_name?: string
  birth_date?: string
  address?: string
}

const emptyForm = {
  store_name: '', email: '', phone: '',
  status: 'inactive', subscription_end: '', notes: ''
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [deletedClients, setDeletedClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [expandId, setExpandId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const loadClients = useCallback(async () => {
    const supabase = createClient()
    const { data: active } = await supabase.from('clients').select('*')
      .is('deleted_at', null).order('created_at', { ascending: false })
    const { data: deleted } = await supabase.from('clients').select('*')
      .not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    setClients(active || [])
    setDeletedClients(deleted || [])
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
      notes: form.notes, deleted_at: null
    })
    setForm({ ...emptyForm }); setShowAdd(false); loadClients()
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
    setEditId(null); setForm({ ...emptyForm }); loadClients()
  }

  // Soft delete
  async function deleteClient(id: string) {
    if (!confirm('Клиентті жоюға сенімдісіз бе? Ол "Жойылғандар" бөліміне өтеді.')) return
    const supabase = createClient()
    await supabase.from('clients').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    loadClients()
  }

  // Restore
  async function restoreClient(id: string) {
    if (!confirm('Клиентті қалпына келтіруге сенімдісіз бе?')) return
    const supabase = createClient()
    await supabase.from('clients').update({ deleted_at: null, status: 'active' }).eq('id', id)
    loadClients()
  }

  // Permanent delete
  async function permanentDelete(id: string) {
    if (!confirm('Клиентті мүлдем жоюға сенімдісіз бе? Бұл қайтарылмайды!')) return
    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', id)
    loadClients()
  }

  async function toggleStatus(client: Client) {
    const newStatus = client.status === 'active' ? 'blocked' : 'active'
    await createClient().from('clients').update({ status: newStatus }).eq('id', client.id)
    loadClients()
  }

  function startEdit(c: Client) {
    setEditId(c.id)
    setForm({ store_name: c.store_name, email: c.email, phone: c.phone || '',
      status: c.status, subscription_end: c.subscription_end || '', notes: c.notes || '' })
    setShowAdd(false)
  }

  function cancelForm() { setShowAdd(false); setEditId(null); setForm({ ...emptyForm }) }

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
    const matchSearch = c.store_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  if (loading) return <p style={{ color: '#6b7280' }}>Жүктелуде...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Клиенттер</h1>
        {activeTab === 'active' && (
          <button className="btn btn-primary" onClick={() => { setShowAdd(true); setEditId(null); setForm({ ...emptyForm }) }}>
            + Клиент қосу
          </button>
        )}
      </div>

      {/* Вкладки */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('active')} style={{
          padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: 14, fontWeight: activeTab === 'active' ? 600 : 400,
          borderBottom: activeTab === 'active' ? '2px solid #185FA5' : '2px solid transparent',
          color: activeTab === 'active' ? '#185FA5' : '#6b7280', marginBottom: -2
        }}>
          Белсенді ({clients.length})
        </button>
        <button onClick={() => setActiveTab('deleted')} style={{
          padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: 14, fontWeight: activeTab === 'deleted' ? 600 : 400,
          borderBottom: activeTab === 'deleted' ? '2px solid #D85A30' : '2px solid transparent',
          color: activeTab === 'deleted' ? '#D85A30' : '#6b7280', marginBottom: -2
        }}>
          🗑 Жойылғандар ({deletedClients.length})
        </button>
      </div>

      {/* Белсенді клиенттер */}
      {activeTab === 'active' && (
        <>
          {(showAdd || editId) && (
            <div className="card" style={{ border: '2px solid #185FA5', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                {editId ? '✏️ Өзгерту' : '➕ Жаңа клиент'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <input placeholder="Дүкен аты *" value={form.store_name} onChange={e => updateForm('store_name', e.target.value)} />
                <input placeholder="Email / Телефон *" value={form.email} onChange={e => updateForm('email', e.target.value)} />
                <input placeholder="Телефон" value={form.phone} onChange={e => updateForm('phone', e.target.value)} />
                <select value={form.status} onChange={e => updateForm('status', e.target.value)}>
                  <option value="inactive">⏸ Белсенді емес</option>
                  <option value="active">✅ Белсенді</option>
                  <option value="blocked">🚫 Блокталған</option>
                </select>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>Подписка мерзімі</label>
                  <input type="date" value={form.subscription_end} onChange={e => updateForm('subscription_end', e.target.value)} />
                </div>
                <input placeholder="Ескертпе" value={form.notes} onChange={e => updateForm('notes', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={editId ? updateClient : addClient}>{editId ? 'Сақтау' : 'Қосу'}</button>
                <button className="btn" onClick={cancelForm}>Болдырмау</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input placeholder="🔍 Іздеу..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 180 }}>
              <option value="all">Барлығы</option>
              <option value="active">✅ Белсенді</option>
              <option value="inactive">⏸ Белсенді емес</option>
              <option value="blocked">🚫 Блокталған</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>Клиент жоқ</div>
            ) : filtered.map(c => (
              <div key={c.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{c.store_name || '—'}</span>
                      <span className={`badge badge-${c.status}`}>
                        {c.status === 'active' ? '✅ Белсенді' : c.status === 'blocked' ? '🚫 Блок' : '⏸ Белсенді емес'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>📧 {c.email}</span>
                      {c.phone && <span style={{ fontSize: 13, color: '#6b7280' }}>📞 {c.phone}</span>}
                      {c.subscription_end && (
                        <span style={{ fontSize: 13, color: isExpired(c.subscription_end) ? '#D85A30' : isExpiringSoon(c.subscription_end) ? '#D97706' : '#0F6E56' }}>
                          📅 {isExpired(c.subscription_end) ? '❌ ' : isExpiringSoon(c.subscription_end) ? '⚠️ ' : '✓ '}
                          {new Date(c.subscription_end).toLocaleDateString('kk-KZ')}
                        </span>
                      )}
                    </div>
                    {expandId === c.id && (
                      <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div><span style={{ fontSize: 11, color: '#6b7280' }}>Аты-жөні</span><div style={{ fontSize: 14 }}>{c.full_name || '—'}</div></div>
                          <div><span style={{ fontSize: 11, color: '#6b7280' }}>Туған күні</span><div style={{ fontSize: 14 }}>{c.birth_date ? new Date(c.birth_date).toLocaleDateString('kk-KZ') : '—'}</div></div>
                          <div><span style={{ fontSize: 11, color: '#6b7280' }}>Мекен-жай</span><div style={{ fontSize: 14 }}>{c.address || '—'}</div></div>
                          <div><span style={{ fontSize: 11, color: '#6b7280' }}>Тіркелген</span><div style={{ fontSize: 14 }}>{new Date(c.created_at).toLocaleDateString('kk-KZ')}</div></div>
                          {c.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ fontSize: 11, color: '#6b7280' }}>Ескертпе</span><div style={{ fontSize: 14 }}>{c.notes}</div></div>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                    <button className="btn btn-sm" onClick={() => setExpandId(expandId === c.id ? null : c.id)}>
                      {expandId === c.id ? '▲' : '▼'}
                    </button>
                    <button className="btn btn-sm" onClick={() => startEdit(c)}>✏️</button>
                    <button className={`btn btn-sm ${c.status === 'active' ? 'btn-warning' : 'btn-success'}`} onClick={() => toggleStatus(c)}>
                      {c.status === 'active' ? '🚫' : '✅'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteClient(c.id)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Жойылған клиенттер */}
      {activeTab === 'deleted' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {deletedClients.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>Жойылған клиент жоқ</div>
          ) : deletedClients.map(c => (
            <div key={c.id} className="card" style={{ padding: 16, borderLeft: '4px solid #D85A30' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c.store_name || '—'}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>📧 {c.email}</div>
                  {c.phone && <div style={{ fontSize: 13, color: '#6b7280' }}>📞 {c.phone}</div>}
                  <div style={{ fontSize: 12, color: '#D85A30', marginTop: 4 }}>
                    🗑 Жойылған: {c.deleted_at ? new Date(c.deleted_at).toLocaleDateString('kk-KZ') : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-success" onClick={() => restoreClient(c.id)}>
                    ♻️ Қалпына келтіру
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => permanentDelete(c.id)}>
                    ❌ Мүлдем жою
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
