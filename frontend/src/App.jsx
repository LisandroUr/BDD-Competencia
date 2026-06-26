import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  HeartHandshake,
  ArrowLeftRight,
  ClipboardList,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Target,
  TrendingUp,
  X,
  ArrowRight,
  Calendar,
  User,
  MessageSquare,
  HelpCircle,
  Menu
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [totals, setTotals] = useState([]);
  const [donations, setDonations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [globalStats, setGlobalStats] = useState({
    total_donations: 0,
    active_campaigns: 0,
    total_transfers: 0,
    overall_target: 0,
    overall_raised: 0
  });

  // Modals
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);

  // Forms
  const [donationForm, setDonationForm] = useState({
    campaignId: '',
    amount: '',
    donorName: '',
    comment: ''
  });

  const [transferForm, setTransferForm] = useState({
    sourceCampaignId: '',
    targetCampaignId: '',
    amount: '',
    reason: ''
  });

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    status: 'active'
  });

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch campaigns list
      const campRes = await fetch(`${API_BASE}/campaigns`);
      if (!campRes.ok) throw new Error('Error al cargar campañas');
      const campData = await campRes.json();
      setCampaigns(campData);

      // Fetch view totals
      const totalsRes = await fetch(`${API_BASE}/campaigns/totals`);
      if (!totalsRes.ok) throw new Error('Error al cargar la vista de totales');
      const totalsData = await totalsRes.json();
      setTotals(totalsData);

      // Fetch donations
      const donRes = await fetch(`${API_BASE}/donations`);
      if (!donRes.ok) throw new Error('Error al cargar donaciones');
      const donData = await donRes.json();
      setDonations(donData);

      // Fetch transfers
      const transRes = await fetch(`${API_BASE}/transfers`);
      if (!transRes.ok) throw new Error('Error al cargar transferencias');
      const transData = await transRes.json();
      setTransfers(transData);

      // Fetch global DB stats
      const statsRes = await fetch(`${API_BASE}/campaigns/stats`);
      if (!statsRes.ok) throw new Error('Error al cargar estadísticas globales');
      const statsData = await statsRes.json();
      setGlobalStats(statsData);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión con el servidor API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 6000);
    }
  };

  // Form Submissions
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear la campaña');
      }

      triggerToast('Campaña creada con éxito.');
      setIsCreateCampaignModalOpen(false);
      setCampaignForm({ title: '', description: '', targetAmount: '', status: 'active' });
      fetchData();
    } catch (err) {
      triggerToast(err.message, false);
    }
  };

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...donationForm,
          amount: parseFloat(donationForm.amount)
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar donación');
      }

      triggerToast(`Donación registrada con éxito por $${parseFloat(donationForm.amount).toFixed(2)}.`);
      setIsDonateModalOpen(false);
      setDonationForm({ campaignId: '', amount: '', donorName: '', comment: '' });
      fetchData();
    } catch (err) {
      triggerToast(err.message, false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferForm,
          amount: parseFloat(transferForm.amount)
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al realizar la transferencia');
      }

      triggerToast(data.message || 'Transferencia atómica realizada con éxito.');
      setIsTransferModalOpen(false);
      setTransferForm({ sourceCampaignId: '', targetCampaignId: '', amount: '', reason: '' });
      fetchData();
    } catch (err) {
      triggerToast(err.message, false);
    }
  };

  // Helper calculations from database aggregates
  const totalDonationsAmount = parseFloat(globalStats.total_donations);
  const activeCampaignsCount = parseInt(globalStats.active_campaigns);
  const totalTransfersAmount = parseFloat(globalStats.total_transfers);
  
  // Calculate average target achievement percentage from DB aggregates
  const overallTarget = parseFloat(globalStats.overall_target);
  const overallRaised = parseFloat(globalStats.overall_raised);
  const targetAchievement = overallTarget > 0 ? (overallRaised / overallTarget) * 100 : 0;

  // Filtered Totals for View Table
  const filteredTotals = totals.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="app-container">
      {/* Sidebar Backdrop Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <HeartHandshake className="sidebar-logo-icon" size={28} color="#06b6d4" />
          <h1 className="sidebar-logo">Donis Manager</h1>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>
        <ul className="sidebar-menu">
          <li 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => { setActiveTab('campaigns'); setIsSidebarOpen(false); }}
          >
            <HeartHandshake size={20} />
            <span>Campañas</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => { setActiveTab('donations'); setIsSidebarOpen(false); }}
          >
            <ClipboardList size={20} />
            <span>Donaciones</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'transfers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('transfers'); setIsSidebarOpen(false); }}
          >
            <ArrowLeftRight size={20} />
            <span>Transferencias</span>
          </li>
        </ul>

        {/* Small educational note on DB project */}
        <div className="glass-panel" style={{ marginTop: 'auto', padding: '16px', fontSize: '0.75rem', color: '#9ca3af' }}>
          <p style={{ fontWeight: '700', color: '#06b6d4', marginBottom: '6px' }}>Materia: Base de Datos II</p>
          <p>• Transacciones SQL atómicas</p>
          <p>• Vista agregada: <code style={{ color: '#10b981' }}>CampaignTotals</code></p>
          <p>• Arquitectura MVC completa</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Mobile Header (only visible on mobile screens) */}
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menú">
            <Menu size={24} />
          </button>
          <div className="mobile-logo-container">
            <HeartHandshake size={22} color="#06b6d4" />
            <span className="mobile-logo-text">Donis Manager</span>
          </div>
        </div>

        {/* Alerts / Toasts */}
        {error && (
          <div className="alert alert-danger animate-fade-in">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button className="modal-close" style={{ marginLeft: 'auto' }} onClick={() => setError(null)}>
              <X size={16} />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="alert alert-success animate-fade-in glow-emerald">
            <CheckCircle2 size={20} />
            <span>{successMessage}</span>
            <button className="modal-close" style={{ marginLeft: 'auto' }} onClick={() => setSuccessMessage(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <header className="content-header">
          <div>
            <h2 className="header-title">
              {activeTab === 'dashboard' && 'Resumen General'}
              {activeTab === 'campaigns' && 'Campañas Activas'}
              {activeTab === 'donations' && 'Historial de Donaciones'}
              {activeTab === 'transfers' && 'Historial de Transferencias Inter-Campañas'}
            </h2>
            <p className="header-subtitle">
              {activeTab === 'dashboard' && 'Métricas claves de recaudación, transferencias y reportes SQL.'}
              {activeTab === 'campaigns' && 'Administra, crea y opera sobre campañas de recaudación.'}
              {activeTab === 'donations' && 'Listado cronológico de aportes realizados por donantes.'}
              {activeTab === 'transfers' && 'Registro de transferencias atómicas de fondos realizadas para balancear campañas.'}
            </p>
          </div>

          <div className="content-header-actions">
            {activeTab === 'campaigns' && (
              <button className="btn-primary" onClick={() => setIsCreateCampaignModalOpen(true)}>
                <Plus size={18} />
                <span>Nueva Campaña</span>
              </button>
            )}
            
            <button className="btn-secondary" onClick={() => {
              setDonationForm({ ...donationForm, campaignId: campaigns[0]?.id || '' });
              setIsDonateModalOpen(true);
            }}>
              <DollarSign size={18} />
              <span>Registrar Donación</span>
            </button>

            <button className="btn-secondary" style={{ borderColor: 'rgba(6,182,212,0.3)' }} onClick={() => {
              setTransferForm({ ...transferForm, sourceCampaignId: campaigns[0]?.id || '', targetCampaignId: campaigns[1]?.id || '' });
              setIsTransferModalOpen(true);
            }}>
              <ArrowLeftRight size={18} />
              <span>Transferir Fondos</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div className="progress-bar-fill" style={{ width: '100px', height: '4px' }}></div>
            <span style={{ marginLeft: '12px', color: '#9ca3af' }}>Cargando datos...</span>
          </div>
        ) : (
          <>
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="animate-fade-in">
                {/* Metrics Row */}
                <div className="metrics-grid">
                  <div className="glass-panel metric-card">
                    <div className="metric-header">
                      <span className="metric-title">Recaudación Total</span>
                      <DollarSign size={20} color="#10b981" />
                    </div>
                    <div className="metric-value">${totalDonationsAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                    <div className="metric-sub">
                      <TrendingUp size={12} color="#10b981" />
                      <span>Suma de todos los aportes individuales</span>
                    </div>
                  </div>

                  <div className="glass-panel metric-card">
                    <div className="metric-header">
                      <span className="metric-title">Campañas Activas</span>
                      <HeartHandshake size={20} color="#06b6d4" />
                    </div>
                    <div className="metric-value">{activeCampaignsCount}</div>
                    <div className="metric-sub">
                      <span>De {campaigns.length} campañas creadas</span>
                    </div>
                  </div>

                  <div className="glass-panel metric-card">
                    <div className="metric-header">
                      <span className="metric-title">Fondos Redirigidos</span>
                      <ArrowLeftRight size={20} color="#f59e0b" />
                    </div>
                    <div className="metric-value">${totalTransfersAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                    <div className="metric-sub">
                      <span>Transferencias inter-campañas</span>
                    </div>
                  </div>

                  <div className="glass-panel metric-card">
                    <div className="metric-header">
                      <span className="metric-title">Meta Global</span>
                      <Target size={20} color="#8b5cf6" />
                    </div>
                    <div className="metric-value">{targetAchievement.toFixed(1)}%</div>
                    <div className="metric-sub">
                      <span>{overallRaised >= overallTarget ? '¡Objetivo global superado!' : 'Progreso de metas de recaudación'}</span>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Progress Bar Chart */}
                <div className="glass-panel chart-container">
                  <div className="chart-header">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Comparativa: Balance Actual vs Objetivo</h3>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color" style={{ background: '#10b981' }}></div>
                        <span>Balance Actual ($)</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)' }}></div>
                        <span>Monto Objetivo ($)</span>
                      </div>
                    </div>
                  </div>

                  {totals.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <p style={{ color: '#4b5563' }}>No hay datos suficientes para graficar</p>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                      {totals.map((item) => {
                        const balance = parseFloat(item.current_balance);
                        const target = parseFloat(item.targetAmount);
                        const percent = Math.min((balance / target) * 100, 100);
                        return (
                          <div key={item.id} className="chart-item">
                            <div className="chart-item-title" title={item.title}>
                              {item.title}
                            </div>
                            <div className="chart-item-bar-container">
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                                <span>Balance: <strong>${balance.toLocaleString('es-AR')}</strong></span>
                                <span>Meta: <strong>${target.toLocaleString('es-AR')}</strong></span>
                              </div>
                              <div className="progress-bar-bg" style={{ position: 'relative', height: '12px' }}>
                                <div 
                                  className="progress-bar-fill" 
                                  style={{ 
                                    width: `${percent}%`, 
                                    height: '100%', 
                                    background: balance >= target ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #06b6d4, #10b981)' 
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="chart-item-percent" style={{ color: balance >= target ? '#10b981' : '#06b6d4' }}>
                              {((balance / target) * 100).toFixed(0)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Campaign Totals Report Table (FROM SQL VIEW) */}
                <div className="glass-panel report-section">
                  <div className="report-header-flex">
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Reporte: Vista de Totales por Campaña</h3>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>Consulta de base de datos directa a la Vista SQL <code style={{ color: '#06b6d4' }}>CampaignTotals</code></p>
                    </div>

                    <div className="report-filters">
                      {/* Search */}
                      <div className="search-input-container">
                        <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#4b5563' }} size={16} />
                        <input 
                          type="text" 
                          placeholder="Buscar campaña..." 
                          className="form-input search-input" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      {/* Dropdown status */}
                      <select 
                        className="form-select status-select" 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">Todos</option>
                        <option value="active">Activas</option>
                        <option value="paused">Pausadas</option>
                        <option value="completed">Completadas</option>
                      </select>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Campaña</th>
                          <th>Estado</th>
                          <th>Meta Objetivo</th>
                          <th>Donado (+)</th>
                          <th>Transferido Recibido (+)</th>
                          <th>Transferido Enviado (-)</th>
                          <th style={{ color: '#06b6d4' }}>Balance Neto</th>
                          <th>Donantes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTotals.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ textCenter: 'center', color: '#4b5563', padding: '24px' }}>No se encontraron campañas</td>
                          </tr>
                        ) : (
                          filteredTotals.map((item) => {
                            const donations = parseFloat(item.total_donations);
                            const rec = parseFloat(item.total_transfers_received);
                            const sent = parseFloat(item.total_transfers_sent);
                            const balance = parseFloat(item.current_balance);
                            const isMet = balance >= parseFloat(item.targetAmount);

                            return (
                              <tr key={item.id}>
                                <td style={{ fontWeight: 600 }}>{item.title}</td>
                                <td>
                                  <span className={`campaign-badge ${
                                    item.status === 'active' ? 'badge-active' : item.status === 'paused' ? 'badge-paused' : 'badge-completed'
                                  }`}>
                                    {item.status === 'active' ? 'activa' : item.status === 'paused' ? 'pausada' : 'completada'}
                                  </span>
                                </td>
                                <td>${parseFloat(item.targetAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td style={{ color: '#10b981' }}>+${donations.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td style={{ color: '#34d399' }}>+${rec.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td style={{ color: '#f87171' }}>-${sent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td style={{ fontWeight: 700, color: isMet ? '#10b981' : '#06b6d4' }}>
                                  ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </td>
                                <td>{item.donation_count}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Campaigns View */}
            {activeTab === 'campaigns' && (
              <div className="animate-fade-in">
                {totals.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '40px', textCenter: 'center', color: '#9ca3af' }}>
                    No hay campañas disponibles. ¡Crea la primera campaña utilizando el botón superior!
                  </div>
                ) : (
                  <div className="campaigns-grid">
                    {totals.map((item) => {
                      const balance = parseFloat(item.current_balance);
                      const target = parseFloat(item.targetAmount);
                      const percent = Math.min((balance / target) * 100, 100);
                      const rawCampaign = campaigns.find(c => c.id === item.id) || {};

                      return (
                        <div key={item.id} className="glass-panel glass-panel-hover campaign-card">
                          <span className={`campaign-badge ${
                            item.status === 'active' ? 'badge-active' : item.status === 'paused' ? 'badge-paused' : 'badge-completed'
                          }`}>
                            {item.status === 'active' ? 'activa' : item.status === 'paused' ? 'pausada' : 'completada'}
                          </span>

                          <h3 className="campaign-title">{item.title}</h3>
                          <p className="campaign-desc">{rawCampaign.description || 'Sin descripción detallada.'}</p>

                          <div className="progress-container">
                            <div className="progress-label">
                              <span>Progreso</span>
                              <span>{((balance / target) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>

                          <div className="campaign-stats-row">
                            <div className="campaign-stat-item">
                              <span className="campaign-stat-val">${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                              <span className="campaign-stat-lbl">Balance Actual</span>
                            </div>
                            <div className="campaign-stat-item" style={{ alignItems: 'flex-end' }}>
                              <span className="campaign-stat-val">${target.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                              <span className="campaign-stat-lbl">Objetivo</span>
                            </div>
                          </div>

                          <div className="campaign-actions">
                            <button 
                              className="btn-primary" 
                              style={{ padding: '8px 12px' }}
                              disabled={item.status !== 'active'}
                              onClick={() => {
                                setDonationForm({ ...donationForm, campaignId: item.id });
                                setIsDonateModalOpen(true);
                              }}
                            >
                              Donar
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '8px 12px' }}
                              disabled={item.status !== 'active' || balance <= 0}
                              onClick={() => {
                                setTransferForm({ ...transferForm, sourceCampaignId: item.id });
                                setIsTransferModalOpen(true);
                              }}
                            >
                              Transferir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Donations View */}
            {activeTab === 'donations' && (
              <div className="glass-panel report-section animate-fade-in">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Registro de Aportes Recibidos</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Campaña</th>
                        <th>Donante</th>
                        <th>Comentario</th>
                        <th style={{ color: '#10b981' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textCenter: 'center', color: '#4b5563', padding: '24px' }}>No se han registrado donaciones aún</td>
                        </tr>
                      ) : (
                        donations.map((d) => (
                          <tr key={d.id}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={14} color="#9ca3af" />
                              {new Date(d.createdAt).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ fontWeight: 600 }}>{d.campaign?.title || `Campaña #${d.campaignId}`}</td>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <User size={14} color="#06b6d4" />
                              {d.donorName}
                            </td>
                            <td style={{ color: '#9ca3af', fontStyle: d.comment ? 'normal' : 'italic' }}>
                              {d.comment ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <MessageSquare size={12} />
                                  {d.comment}
                                </span>
                              ) : 'Sin comentarios'}
                            </td>
                            <td style={{ fontWeight: 700, color: '#10b981' }}>
                              +${parseFloat(d.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transfers View */}
            {activeTab === 'transfers' && (
              <div className="glass-panel report-section animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registro de Transferencias Atómicas</h3>
                  <span className="campaign-badge badge-active" style={{ fontSize: '0.65rem' }}>Garantía Transaccional ACID</span>
                </div>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Campaña Origen</th>
                        <th></th>
                        <th>Campaña Destino</th>
                        <th>Motivo/Detalle</th>
                        <th style={{ color: '#f59e0b' }}>Monto Transferido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textCenter: 'center', color: '#4b5563', padding: '24px' }}>No se han realizado transferencias de fondos entre campañas</td>
                        </tr>
                      ) : (
                        transfers.map((t) => (
                          <tr key={t.id}>
                            <td>
                              {new Date(t.createdAt).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ fontWeight: 600, color: '#f87171' }}>{t.sourceCampaign?.title || `Campaña #${t.sourceCampaignId}`}</td>
                            <td style={{ width: '40px', textCenter: 'center' }}>
                              <ArrowRight size={16} color="#9ca3af" />
                            </td>
                            <td style={{ fontWeight: 600, color: '#34d399' }}>{t.targetCampaign?.title || `Campaña #${t.targetCampaignId}`}</td>
                            <td style={{ color: '#9ca3af' }}>{t.reason || 'Redirección de fondos'}</td>
                            <td style={{ fontWeight: 700, color: '#f59e0b' }}>
                              ${parseFloat(t.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal: Crear Campaña */}
      {isCreateCampaignModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateCampaignModalOpen(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Crear Nueva Campaña</h3>
              <button className="modal-close" onClick={() => setIsCreateCampaignModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className="form-group">
                <label className="form-label">Título de la Campaña *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Insumos de Invierno" 
                  className="form-input"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea 
                  placeholder="Detalla los objetivos de la recaudación..." 
                  className="form-input" 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Monto Objetivo (ARS) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="1"
                  placeholder="50000.00" 
                  className="form-input"
                  value={campaignForm.targetAmount}
                  onChange={(e) => setCampaignForm({ ...campaignForm, targetAmount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estado Inicial</label>
                <select 
                  className="form-select"
                  value={campaignForm.status}
                  onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}
                >
                  <option value="active">Activa (Abierta a recibir donaciones)</option>
                  <option value="paused">Pausada</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateCampaignModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear Campaña</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Donar */}
      {isDonateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDonateModalOpen(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Aporte Económico</h3>
              <button className="modal-close" onClick={() => setIsDonateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDonation}>
              <div className="form-group">
                <label className="form-label">Seleccionar Campaña *</label>
                <select 
                  required
                  className="form-select"
                  value={donationForm.campaignId}
                  onChange={(e) => setDonationForm({ ...donationForm, campaignId: e.target.value })}
                >
                  <option value="">Seleccione una campaña...</option>
                  {campaigns.filter(c => c.status === 'active').map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto del Aporte (ARS) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="0.1"
                  placeholder="Monto en pesos" 
                  className="form-input"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre del Donante (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Dejar vacío para 'Anónimo'" 
                  className="form-input"
                  value={donationForm.donorName}
                  onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mensaje o Comentario</label>
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje de apoyo..." 
                  className="form-input"
                  value={donationForm.comment}
                  onChange={(e) => setDonationForm({ ...donationForm, comment: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsDonateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transferir Fondos */}
      {isTransferModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTransferModalOpen(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeftRight size={20} color="#f59e0b" />
                <span>Transferencia de Fondos</span>
              </h3>
              <button className="modal-close" onClick={() => setIsTransferModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="alert alert-info" style={{ padding: '8px 12px', fontSize: '0.75rem', marginBottom: '16px' }}>
              <HelpCircle size={16} />
              <span>Esta operación es atómica. Retirará fondos del origen y los acreditará en el destino en una sola transacción SQL.</span>
            </div>

            <form onSubmit={handleCreateTransfer}>
              <div className="form-group">
                <label className="form-label">Campaña Origen (Resta Fondos) *</label>
                <select 
                  required
                  className="form-select"
                  value={transferForm.sourceCampaignId}
                  onChange={(e) => setTransferForm({ ...transferForm, sourceCampaignId: e.target.value })}
                >
                  <option value="">Seleccione origen...</option>
                  {totals.filter(t => t.status === 'active' && parseFloat(t.current_balance) > 0).map(t => (
                    <option key={t.id} value={t.id}>{t.title} (Disp: ${parseFloat(t.current_balance).toLocaleString('es-AR')})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Campaña Destino (Suma Fondos) *</label>
                <select 
                  required
                  className="form-select"
                  value={transferForm.targetCampaignId}
                  onChange={(e) => setTransferForm({ ...transferForm, targetCampaignId: e.target.value })}
                >
                  <option value="">Seleccione destino...</option>
                  {campaigns.filter(c => c.status === 'active' && parseInt(c.id) !== parseInt(transferForm.sourceCampaignId)).map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto a Transferir (ARS) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="0.1"
                  placeholder="Monto a debitar del origen" 
                  className="form-input"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo o Justificación *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Redirección por cumplimiento de meta..." 
                  className="form-input"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsTransferModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}>Ejecutar Transferencia</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
