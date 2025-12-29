import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Perfil.css'

export default function Perfil() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState({ ganho_fixo_mensal: 0, nome: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    carregarPerfil()
  }, [])

  const carregarPerfil = async () => {
    try {
      const response = await api.get('/perfil')
      setPerfil(response.data)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGanhoFixo = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put('/perfil/ganho-fixo', {
        ganho_fixo_mensal: perfil.ganho_fixo_mensal
      })
      setPerfil(response.data)
      setMessage({ type: 'success', text: 'Ganho fixo atualizado com sucesso!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao atualizar ganho fixo' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleNome = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put('/perfil/nome', {
        nome: perfil.nome
      })
      setPerfil(response.data)
      setMessage({ type: 'success', text: 'Nome atualizado com sucesso!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao atualizar nome' 
      })
    } finally {
      setSaving(false)
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="container">
      <div className="perfil-header">
        <h2>👤 Perfil</h2>
        <p className="perfil-subtitle">Gerencie suas informações pessoais e ganho fixo</p>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </div>
      )}

      <div className="grid grid-2">
        {/* Ganho Fixo Mensal */}
        <div className="card">
          <div className="card-icon">💰</div>
          <h3>Ganho Fixo Mensal</h3>
          <p className="card-description">
            Configure seu ganho fixo mensal (salário) para ter uma melhor visão das suas finanças.
            Este valor será usado para cálculos e projeções no dashboard.
          </p>
          
          <form onSubmit={handleGanhoFixo}>
            <div className="form-group">
              <label htmlFor="ganho_fixo">Valor Mensal</label>
              <input
                type="number"
                id="ganho_fixo"
                step="0.01"
                min="0"
                value={perfil.ganho_fixo_mensal || ''}
                onChange={(e) => setPerfil({ ...perfil, ganho_fixo_mensal: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              {perfil.ganho_fixo_mensal > 0 && (
                <p className="form-hint">
                  Valor configurado: <strong>{formatarMoeda(perfil.ganho_fixo_mensal)}</strong>
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Ganho Fixo'}
            </button>
          </form>
        </div>

        {/* Informações Pessoais */}
        <div className="card">
          <div className="card-icon">👤</div>
          <h3>Informações Pessoais</h3>
          <p className="card-description">
            Atualize suas informações pessoais. Seu email não pode ser alterado.
          </p>
          
          <form onSubmit={handleNome}>
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                value={perfil.nome || ''}
                onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                placeholder="Seu nome"
                required
                minLength={2}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={perfil.email || ''}
                disabled
                className="input-disabled"
              />
              <p className="form-hint">O email não pode ser alterado</p>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Nome'}
            </button>
          </form>
        </div>
      </div>

      {/* Dicas */}
      <div className="card tips-card">
        <h3>💡 Dicas</h3>
        <ul className="tips-list">
          <li>
            <strong>Ganho Fixo:</strong> Configure seu salário ou renda fixa mensal para ter projeções mais precisas.
          </li>
          <li>
            <strong>Receitas Adicionais:</strong> Você pode adicionar outras receitas além do ganho fixo nas transações.
          </li>
          <li>
            <strong>Controle:</strong> O sistema calcula automaticamente quanto você está gastando em relação ao seu ganho fixo.
          </li>
        </ul>
      </div>
    </div>
  )
}

