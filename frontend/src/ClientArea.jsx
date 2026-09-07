import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { User, Lock, Phone, ArrowRight, Bell, History, MapPin, LogOut, Star, Clock, CheckCircle2, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './App';
import toast from 'react-hot-toast';
import './index.css';

// --- AUTHENTIFICATION ---
function AuthScreen() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { phone, password } : { phone, password, name };

    try {
      const res = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
        toast.success(isLogin ? "Connexion réussie !" : "Compte créé !");
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center relative" style={{ minHeight: '80vh' }}>
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} className="glass card w-full" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-6">
          <User size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl">{isLogin ? t('login_title') : t('register_title')}</h2>
          <p className="text-muted">{t('access_account')}</p>
        </div>

        {!isLogin && (
          <div className="form-group">
            <label className="form-label">{t('fullname')}</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input" 
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">{t('phone')}</label>
          <input 
            type="tel" 
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="form-input"
            dir="ltr"
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('password')}</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input" 
          />
        </div>

        <button type="submit" className="btn btn-primary mb-4" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isLogin ? t('login_btn') : t('register_btn'))}
        </button>
        
        <p className="text-center text-sm text-muted">
          {isLogin ? t('no_account') : t('has_account')}
          <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background:'none', border:'none', color:'#0ea5e9', cursor:'pointer', fontWeight:'bold', margin:'0 4px' }}>
            {isLogin ? t('register_title') : t('login_title')}
          </button>
        </p>
      </form>
    </div>
  );
}

// --- TABLEAU DE BORD CLIENT ---
function ClientDashboard() {
  const { t, i18n } = useTranslation();
  const { user, token, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('reservations');
  
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Avis form state
  const [reviewResId, setReviewResId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchReservations = async () => {
    const res = await fetch('/api/users/reservations', { headers: { 'Authorization': `Bearer ${token}` }});
    if(res.ok) setReservations(await res.json());
  };

  const fetchNotifications = async () => {
    const res = await fetch('/api/users/notifications', { headers: { 'Authorization': `Bearer ${token}` }});
    if(res.ok) setNotifications(await res.json());
  };

  useEffect(() => {
    fetchReservations();
    fetchNotifications();
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/users/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reservation_id: reviewResId, rating, comment })
      });
      toast.success("Merci pour votre avis !");
      setReviewResId(null);
    } catch (e) {
      toast.error("Erreur d'envoi de l'avis");
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'En attente': return '#f59e0b'; // orange
      case 'Acceptée': return '#3b82f6'; // blue
      case 'En route': return '#8b5cf6'; // purple
      case 'En cours': return '#06b6d4'; // cyan
      case 'Terminée': return '#10b981'; // green
      default: return '#64748b';
    }
  };

  return (
    <div className="container" style={{ padding: '0' }}>
      {/* HEADER MOBILE */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm" style={{ position: 'sticky', top:0, zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={toggleLanguage} 
            style={{ padding: '4px 8px', fontWeight: 'bold', border: '1px solid #cbd5e1', borderRadius: '5px', backgroundColor: 'transparent' }}
          >
            {i18n.language === 'fr' ? 'عربي' : 'FR'}
          </button>
          <ThemeToggle />
        </div>
        <h1 className="text-xl font-bold logo-text m-0">{t('client_area')}</h1>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('notifications')} style={{ background:'none', border:'none', position:'relative' }}>
            <Bell size={24} className={activeTab === 'notifications' ? 'text-primary' : 'text-muted'} />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{ position:'absolute', top:'-2px', right:'-2px', background:'red', width:'10px', height:'10px', borderRadius:'50%' }}></span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 mb-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl m-0">{t('hello')}, {user.name} 👋</h2>
          <button onClick={() => window.location.href = '/'} className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '0.9rem', borderRadius: '20px' }}>
            + Nouvelle demande
          </button>
        </div>

        {/* TABS CONTENT */}
        {activeTab === 'reservations' && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-2">{t('tracking')}</h3>
            {reservations.length === 0 ? (
              <div className="card text-center p-8 flex flex-col items-center">
                <p className="text-muted mb-4">{t('no_reservations')}</p>
                <button onClick={() => window.location.href = '/'} className="btn btn-primary" style={{ width: 'auto' }}>
                  Faire ma première réservation
                </button>
              </div>
            ) : (
              reservations.map(res => (
                <div key={res.id} className="card p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold">{res.service.toUpperCase()}</h4>
                    <span className="text-xs px-2 py-1 rounded-full text-white font-semibold" style={{ backgroundColor: getStatusColor(res.status) }}>
                      {res.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-2"><Clock size={14} className="inline mx-1"/> {new Date(res.date_reservation).toLocaleDateString('fr-FR')}</p>
                  
                  <div className="flex items-center my-4">
                    <div style={{ flex: 1, height: '4px', backgroundColor: res.status !== 'En attente' ? getStatusColor(res.status) : '#e2e8f0', borderRadius: '4px' }}></div>
                  </div>

                  {res.status === 'Terminée' && (
                    <button 
                      onClick={() => setReviewResId(res.id)}
                      className="btn mt-2" 
                      style={{ padding: '8px', fontSize:'0.9rem', backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
                    >
                      <Star size={16} className="inline mx-2"/> {t('leave_review')}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Formulaire Avis (Modal) */}
        {reviewResId && (
           <div className="card animate-fade-in-up mt-4" style={{ border: '2px solid #fbbf24' }}>
             <h4 className="font-bold mb-2 flex items-center"><MessageSquare size={18} className="mx-2"/> {t('rate_intervention')}</h4>
             <form onSubmit={submitReview}>
                <div className="flex gap-2 mb-4 justify-center" dir="ltr">
                  {[1,2,3,4,5].map(num => (
                    <Star key={num} size={28} onClick={() => setRating(num)} className={rating >= num ? "text-yellow-400" : "text-gray-300"} style={{ cursor: 'pointer' }} />
                  ))}
                </div>
                <textarea className="form-input mb-4" required value={comment} onChange={e=>setComment(e.target.value)}></textarea>
                <div className="flex gap-2">
                  <button type="button" className="btn" style={{ flex:1, backgroundColor:'#f1f5f9', color:'#64748b'}} onClick={() => setReviewResId(null)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-primary" style={{ flex:2 }}>{t('send')}</button>
                </div>
             </form>
           </div>
        )}

        {activeTab === 'notifications' && (
          <div className="flex flex-col gap-3 animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-2">{t('notifications')}</h3>
            {notifications.map(n => (
              <div key={n.id} className="card p-4 flex gap-3 items-start" style={{ borderLeft: n.is_read ? 'none' : '4px solid var(--primary)', borderRight: n.is_read ? 'none' : '4px solid var(--primary)' }}>
                <Bell size={20} className="text-primary mt-1" />
                <div>
                  <p className="text-sm">{n.message}</p>
                  <span className="text-xs text-muted">{new Date(n.date_notif).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-2">{t('my_profile')}</h3>
            <div className="card p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 p-4 rounded-full text-primary"><User size={32}/></div>
                <div>
                  <h4 className="font-bold text-lg">{user.name}</h4>
                  <p className="text-muted" dir="ltr"><Phone size={14} className="inline mx-1"/> {user.phone}</p>
                </div>
              </div>
              <button className="btn w-full mb-4" style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                <MapPin size={18} className="mx-2"/> {t('manage_addresses')}
              </button>
              <button onClick={logout} className="btn w-full" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                <LogOut size={18} className="mx-2"/> {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION MOBILE */}
      <div className="flex justify-around items-center bg-white shadow-lg" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 0', borderTop: '1px solid #e2e8f0', maxWidth: '600px', margin: '0 auto', zIndex: 10 }}>
        <button onClick={() => setActiveTab('reservations')} className={`flex flex-col items-center gap-1 ${activeTab === 'reservations' ? 'text-primary' : 'text-muted'}`} style={{ background:'none', border:'none' }}>
          <History size={24} />
          <span className="text-xs font-semibold">{t('tab_tracking')}</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-primary' : 'text-muted'}`} style={{ background:'none', border:'none' }}>
          <User size={24} />
          <span className="text-xs font-semibold">{t('tab_profile')}</span>
        </button>
      </div>
    </div>
  );
}

// MAIN COMPONENT
export default function ClientArea() {
  const { token } = useContext(AuthContext);
  return token ? <ClientDashboard /> : <AuthScreen />;
}
