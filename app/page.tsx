'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/dashboard' : '/login')
    })
  }, [router])
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: '#6b7280' }}>Жүктелуде...</p>
    </div>
  )
}
