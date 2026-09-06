import React, { useState, useEffect } from 'react';
import { Lock, LogOut, RefreshCcw, Calendar, User, Phone, MapPin, Check, Trash2, CheckCircle2, Users, Wrench, CalendarCheck, TrendingUp, Search, Filter, Settings, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './index.css';

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Data states
  const [reservations, setReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [stats, setStats] = useState(null);
  
  // UI states
  const [activeTab, setActiveTab] = useState('reservations');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Toutes');
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newService, setNewService] = useState({ name: '', description: '', icon_type: 'droplet' });
  const [newTech, setNewTech] = useState({ name: '', phone: '', specialty: '' });

  const ADMIN_PASSWORD = "admin";

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const resRes = await fetch('/api/admin/reservations');
      if (resRes.ok) setReservations(await resRes.json());
      
      const resServ = await fetch('/api/services');
      if (resServ.ok) setServices(await resServ.json());
      
      const resTech = await fetch('/api/admin/technicians');
      if (resTech.ok) setTechnicians(await resTech.json());
      
      const resStats = await fetch('/api/admin/stats');
      if (resStats.ok) setStats(await resStats.json());
    } catch (e) {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchAllData();
      toast.success("Connexion réussie");
    } else {
      toast.error("Mot de passe incorrect");
    }
  };

  // Polling for real-time alerts
  useEffect(() => {
    let interval;
    if (isAuthenticated) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/admin/reservations');
          if (res.ok) {
            const newData = await res.json();
            setReservations(prev => {
              if (prev.length > 0 && newData.length > prev.length) {
                const newReservation = newData[0]; // Assuming newest is first due to ORDER BY DESC
                toast.success(`🔔 Nouvelle réservation de ${newReservation.name} pour ${newReservation.service} !`, {
                  duration: 5000,
                  style: { border: '1px solid #0ea5e9', padding: '16px', color: '#0ea5e9' },
                  iconTheme: { primary: '#0ea5e9', secondary: '#FFFAEE' },
                });
                
                // Refresh stats and other data
                fetchAllData();
              }
              return newData;
            });
          }
        } catch (e) {
          // Silent fail for polling
        }
      }, 10000); // Check every 10 seconds
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // --- RESERVATIONS ---
  const updateStatus = async (id, status) => {
    let price = undefined;
    if (status === 'Terminée') {
      const input = window.prompt("Entrez le montant facturé (en DZD) :");
      if (input === null) return;
      price = parseFloat(input) || 0;
    }
    try {
      const response = await fetch(`/api/admin/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, price })
      });
      const data = await response.json();
      fetchAllData();
      toast.success("Statut mis à jour");
      if (data.smsSent) {
        toast.success(`✅ SMS simulé envoyé au ${data.phone}`, {
          style: { border: '1px solid #10b981', padding: '16px', color: '#10b981' },
          iconTheme: { primary: '#10b981', secondary: '#FFFAEE' },
        });
      }
    } catch (error) {
      toast.error("Erreur de mise à jour");
    }
  };

  const deleteReservation = async (id) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      try {
        await fetch(`/api/admin/reservations/${id}`, { method: 'DELETE' });
        fetchAllData();
        toast.success("Réservation supprimée");
      } catch (error) { toast.error("Erreur"); }
    }
  };

  // --- SERVICES ---
  const addService = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });
      setNewService({ name: '', description: '', icon_type: 'droplet' });
      fetchAllData();
      toast.success("Service ajouté");
    } catch (e) { toast.error("Erreur"); }
  };
  
  const deleteService = async (id) => {
    if(window.confirm("Supprimer ce service ?")) {
      try {
        await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
        fetchAllData();
        toast.success("Service supprimé");
      } catch (e) { toast.error("Erreur"); }
    }
  };

  // --- TECHNICIANS ---
  const addTech = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTech)
      });
      setNewTech({ name: '', phone: '', specialty: '' });
      fetchAllData();
      toast.success("Technicien ajouté");
    } catch (e) { toast.error("Erreur"); }
  };
  
  const deleteTech = async (id) => {
    if(window.confirm("Supprimer ce technicien ?")) {
      try {
        await fetch(`/api/admin/technicians/${id}`, { method: 'DELETE' });
        fetchAllData();
        toast.success("Technicien supprimé");
      } catch (e) { toast.error("Erreur"); }
    }
  };

  // --- EXPORT PDF ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Rapport des Réservations - SERVICE-GO", 14, 15);
    
    const tableColumn = ["ID", "Service", "Client", "Téléphone", "Statut", "Date"];
    const tableRows = [];

    filteredReservations.forEach(res => {
      const resData = [
        res.id,
        res.service,
        res.name,
        res.phone,
        res.status,
        new Date(res.date_reservation).toLocaleDateString('fr-FR')
      ];
      tableRows.push(resData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save(`reservations_${new Date().toLocaleDateString('fr-FR').replace(/\//g,'-')}.pdf`);
    toast.success("PDF généré !");
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) || res.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'Toutes' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <form onSubmit={handleLogin} className="glass card w-full" style={{ maxWidth: '400px' }}>
          <div className="text-center mb-6">
            <Lock size={48} className="text-primary mx-auto mb-4" />
            <h2 className="text-2xl">Espace Pro</h2>
            <p className="text-muted">Accès réservé à l'entreprise</p>
          </div>
          <div className="form-group">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input text-center" placeholder="Mot de passe..." required />
          </div>
          <button type="submit" className="btn btn-primary">Connexion</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1000px', paddingTop: '40px', paddingBottom: '40px' }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl text-primary font-bold">Tableau de bord</h1>
          <p className="text-muted">Administration SERVIECE-GO</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchAllData} className="btn" style={{ padding: '10px', width: 'auto' }} title="Actualiser">
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="btn" style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#64748b', width: 'auto', border: '1px solid #cbd5e1' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </header>

      {/* STATISTIQUES */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card text-center p-4 shadow-sm" style={{ backgroundColor: '#eff6ff' }}>
            <Users size={24} className="text-blue-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{stats.clients}</h3>
            <p className="text-xs text-muted">Clients</p>
          </div>
          <div className="card text-center p-4 shadow-sm" style={{ backgroundColor: '#f5f3ff' }}>
            <Wrench size={24} className="text-purple-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{stats.technicians}</h3>
            <p className="text-xs text-muted">Techniciens</p>
          </div>
          <div className="card text-center p-4 shadow-sm" style={{ backgroundColor: '#fffbeb' }}>
            <CalendarCheck size={24} className="text-yellow-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{stats.reservationsToday}</h3>
            <p className="text-xs text-muted">Aujourd'hui</p>
          </div>
          <div className="card text-center p-4 shadow-sm" style={{ backgroundColor: '#f0fdf4' }}>
            <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{stats.completed}</h3>
            <p className="text-xs text-muted">Interv. Terminées</p>
          </div>
          <div className="card text-center p-4 shadow-sm col-span-2 md:col-span-1" style={{ backgroundColor: '#fef2f2' }}>
            <TrendingUp size={24} className="text-red-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{stats.revenue} DZD</h3>
            <p className="text-xs text-muted">Chiffre d'Affaires</p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <button className={`p-3 font-bold ${activeTab === 'reservations' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`} onClick={() => setActiveTab('reservations')}>
          <FileText size={18} className="inline mr-2"/> Réservations
        </button>
        <button className={`p-3 font-bold ${activeTab === 'services' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`} onClick={() => setActiveTab('services')}>
          <Settings size={18} className="inline mr-2"/> Services
        </button>
        <button className={`p-3 font-bold ${activeTab === 'technicians' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`} onClick={() => setActiveTab('technicians')}>
          <Wrench size={18} className="inline mr-2"/> Techniciens
        </button>
      </div>

      {/* CONTENU RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="animate-fade-in-up">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." className="form-input" style={{ paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select className="form-input" style={{ paddingLeft: '40px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="Toutes">Toutes les réservations</option>
                <option value="En attente">En attente</option>
                <option value="Acceptée">Acceptée</option>
                <option value="En route">En route</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
              </select>
            </div>
            <button onClick={exportPDF} className="btn bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center px-4" style={{ width: 'auto' }}>
              <Download size={18} className="mr-2" /> Exporter PDF
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {filteredReservations.length === 0 && <p className="text-center py-8 text-muted">Aucune réservation trouvée.</p>}
            {filteredReservations.map((res) => (
              <div key={res.id} className="card" style={{ opacity: res.status === 'Terminée' ? 0.7 : 1 }}>
                <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <div className="flex gap-2 items-center">
                    <span className="font-semibold px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">{res.service}</span>
                    {res.status === 'Terminée' && <span className="text-green-600 flex items-center gap-1 text-sm font-semibold"><CheckCircle2 size={16}/> Terminée</span>}
                  </div>
                  <span className="text-sm text-muted flex items-center gap-1"><Calendar size={14} /> {new Date(res.date_reservation).toLocaleString('fr-FR')}</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <p><User size={16} className="inline mr-2 text-muted" /> <strong>{res.name}</strong></p>
                    <p><Phone size={16} className="inline mr-2 text-muted" /> <a href={`tel:${res.phone}`} className="text-primary">{res.phone}</a></p>
                    <p><MapPin size={16} className="inline mr-2 text-muted" /> <span>{res.address}</span></p>
                  </div>
                  {res.details && (
                    <div className="p-3 bg-gray-50 rounded text-sm mt-2 md:mt-0">
                      <strong>Détails :</strong> {res.details}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  <select className="form-input w-auto min-w-[130px] p-2" value={res.status} onChange={(e) => updateStatus(res.id, e.target.value)}>
                    <option value="En attente">En attente</option>
                    <option value="Acceptée">Acceptée</option>
                    <option value="En route">En route</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminée">Terminée</option>
                  </select>
                  <button onClick={() => deleteReservation(res.id)} className="btn bg-red-100 text-red-600 px-4 py-2 w-auto flex items-center"><Trash2 size={16} className="mr-2"/> Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENU SERVICES */}
      {activeTab === 'services' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="md:col-span-1">
            <div className="card">
              <h3 className="font-bold mb-4">Ajouter un Service</h3>
              <form onSubmit={addService} className="flex flex-col gap-3">
                <input type="text" className="form-input" placeholder="Nom du service..." required value={newService.name} onChange={e=>setNewService({...newService, name: e.target.value})} />
                <textarea className="form-input" placeholder="Description..." required value={newService.description} onChange={e=>setNewService({...newService, description: e.target.value})}></textarea>
                <select className="form-input" value={newService.icon_type} onChange={e=>setNewService({...newService, icon_type: e.target.value})}>
                  <option value="droplet">Goutte d'eau (Plomberie)</option>
                  <option value="flame">Flamme (Chauffage)</option>
                  <option value="snowflake">Flocon (Climatisation)</option>
                  <option value="tool">Outil (Général)</option>
                </select>
                <button type="submit" className="btn btn-primary mt-2">Ajouter</button>
              </form>
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-3">
            {services.map(srv => (
              <div key={srv.id} className="card flex justify-between items-center p-4">
                <div>
                  <h4 className="font-bold text-lg">{srv.name}</h4>
                  <p className="text-sm text-muted">{srv.description}</p>
                </div>
                <button onClick={() => deleteService(srv.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded"><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENU TECHNICIENS */}
      {activeTab === 'technicians' && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="md:col-span-1">
            <div className="card">
              <h3 className="font-bold mb-4">Ajouter un Technicien</h3>
              <form onSubmit={addTech} className="flex flex-col gap-3">
                <input type="text" className="form-input" placeholder="Nom complet..." required value={newTech.name} onChange={e=>setNewTech({...newTech, name: e.target.value})} />
                <input type="tel" className="form-input" placeholder="Téléphone..." required value={newTech.phone} onChange={e=>setNewTech({...newTech, phone: e.target.value})} />
                <input type="text" className="form-input" placeholder="Spécialité (ex: Plombier)..." required value={newTech.specialty} onChange={e=>setNewTech({...newTech, specialty: e.target.value})} />
                <button type="submit" className="btn btn-primary mt-2">Ajouter</button>
              </form>
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technicians.map(tech => (
              <div key={tech.id} className="card p-4 relative">
                <button onClick={() => deleteTech(tech.id)} className="absolute top-3 right-3 text-red-500 bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><Wrench size={24}/></div>
                  <div>
                    <h4 className="font-bold">{tech.name}</h4>
                    <p className="text-xs text-primary font-semibold">{tech.specialty}</p>
                  </div>
                </div>
                <p className="text-sm text-muted mt-2"><Phone size={14} className="inline mr-1"/> {tech.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Admin;
