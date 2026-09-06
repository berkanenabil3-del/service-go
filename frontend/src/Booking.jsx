import React, { useState, useEffect } from 'react';
import { PhoneCall, Droplet, Flame, Snowflake, UserCircle, ArrowLeft, PenTool, Star, CreditCard, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './App';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import './index.css';

function Booking() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', details: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'card'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Fetch dynamic services
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setServices(data);
      })
      .catch(err => console.error(err));

    // Fetch public reviews
    fetch('/api/reviews/public')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setReviews(data);
      })
      .catch(err => console.error(err));
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleServiceSelect = (serviceName) => {
    setSelectedService(serviceName);
    setStep(2);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simulate Card Payment
    if (paymentMethod === 'card') {
      const isCardValid = window.confirm("Simulation Paiement CIB/Edahabia : Confirmer le prélèvement ?");
      if (!isCardValid) {
        toast.error("Paiement annulé");
        return;
      }
    }

    setIsSubmitting(true);
    
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      // In a real app, you'd send paymentMethod to backend too
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...formData, service: selectedService })
      });
      
      if (response.ok) setIsSuccess(true);
      else toast.error("Une erreur est survenue");
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedService(null);
    setFormData({ name: '', phone: '', address: '', details: '' });
    setPaymentMethod('cash');
    setIsSuccess(false);
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'droplet': return <Droplet size={32} className="mb-2" style={{ color: '#3b82f6' }} />;
      case 'flame': return <Flame size={32} className="mb-2" style={{ color: '#ef4444' }} />;
      case 'snowflake': return <Snowflake size={32} className="mb-2" style={{ color: '#06b6d4' }} />;
      default: return <PenTool size={32} className="mb-2" style={{ color: '#6b7280' }} />;
    }
  };

  if (isSuccess) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center glass animate-scale-in" style={{ padding: '40px' }}>
          <div className="bg-green-100 text-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('success_title')}</h2>
          <p className="text-muted mb-4">{t('success_desc')}</p>
          {paymentMethod === 'card' && (
            <p className="text-green-600 font-bold mb-6">Paiement validé avec succès ✅</p>
          )}
          <button onClick={resetForm} className="btn btn-primary">{t('back_home')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container pb-10">
      <header className="app-header animate-fade-in-up flex flex-col items-center relative">
        <div style={{ position: 'absolute', left: '10px', top: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={toggleLanguage} 
            style={{ padding: '5px 10px', fontWeight: 'bold', border: '1px solid var(--glass-border)', borderRadius: '5px', backgroundColor: 'var(--glass-bg)', color: 'var(--text-dark)' }}
          >
            {i18n.language === 'fr' ? 'عربي' : 'FR'}
          </button>
          <ThemeToggle />
        </div>
        <Link to="/client" style={{ position: 'absolute', right: '15px', top: '10px', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#0ea5e9', color: 'white', padding: '6px 12px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)' }}>
          <UserCircle size={18} />
          {t('client_area', 'Espace Client')}
        </Link>
        <div className="flex items-center gap-3 mt-8">
          <Droplet size={28} className="text-primary" />
          <h1 className="logo-text" style={{ fontSize: '1.8rem' }}>SERVICE-GO</h1>
          <Flame size={28} className="text-secondary" />
        </div>
        <p className="text-muted text-sm mt-1 font-medium">{t('subtitle')}</p>
      </header>

      {/* STEP 1: Choisir un service */}
      {step === 1 && (
        <div className="animate-fade-in-up delay-100">
          
          <div className="mb-6 flex flex-col gap-3">
            <div className="card banner-emergency flex flex-col gap-3" style={{ padding: '16px' }}>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full" style={{ color: '#ef4444' }}><PhoneCall size={24} /></div>
                <div>
                  <h3 className="font-bold" style={{ fontSize: '1.1rem', color: '#dc2626' }}>{t('emergency')}</h3>
                  <p className="text-sm" style={{ color: '#ef4444' }}>{t('click_call')}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <a href="tel:0661430430" className="flex-1 bg-white text-red-600 rounded-lg py-2 flex flex-col items-center justify-center font-bold text-sm" style={{ border: '1px solid #fca5a5', textDecoration: 'none' }}>
                  <span className="text-xs text-gray-500 font-medium mb-0.5">Noureddine</span>
                  0661 43 04 30
                </a>
                <a href="tel:0661219405" className="flex-1 bg-white text-red-600 rounded-lg py-2 flex flex-col items-center justify-center font-bold text-sm" style={{ border: '1px solid #fca5a5', textDecoration: 'none' }}>
                  <span className="text-xs text-gray-500 font-medium mb-0.5">Sofiane</span>
                  0661 21 94 05
                </a>
              </div>
            </div>
            
            <div className="card banner-promo" style={{ padding: '16px' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-600 font-bold">🎁 {t('promo_title')}</span>
              </div>
              <p className="text-sm text-green-700">{t('promo_desc')}</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('our_services')}</h2>
            <p className="text-muted text-sm">{t('select_domain')}</p>
          </div>
          
          <div className="grid gap-4 mb-10">
            {services.map((srv) => (
              <div key={srv.id} className="service-card card glass" onClick={() => handleServiceSelect(srv.name)}>
                {renderIcon(srv.icon_type)}
                <h3 className="text-xl font-semibold mb-1">{srv.name}</h3>
                <p className="text-muted text-sm">{srv.description}</p>
              </div>
            ))}
          </div>

          {/* Section Avis Publics */}
          {reviews.length > 0 && (
            <div className="mt-10 pt-8" style={{ borderTop: '1px solid #e2e8f0' }}>
              <h2 className="text-xl font-bold text-center mb-6 text-gray-800">Nos clients parlent de nous 🌟</h2>
              <div className="flex overflow-x-auto gap-4 pb-4" style={{ scrollSnapType: 'x mandatory' }}>
                {reviews.map((rev, idx) => (
                  <div key={idx} className="card glass min-w-[250px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                    <div className="flex gap-1 mb-2 text-yellow-400">
                      {[...Array(rev.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                    </div>
                    <p className="text-sm italic text-gray-700 mb-3">"{rev.comment}"</p>
                    <p className="text-xs font-bold text-primary">- {rev.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Formulaire */}
      {step === 2 && (
        <div className="card glass animate-fade-in-up">
          <button onClick={() => setStep(1)} className="text-muted mb-4 flex items-center gap-2 hover:text-primary transition-colors">
            <ArrowLeft size={20} /> {t('back')}
          </button>
          
          <h2 className="text-xl font-bold mb-6 text-center text-gray-800">{t('form_title')}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('fullname')}</label>
              <input type="text" name="name" required className="form-input" value={formData.name} onChange={handleInputChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input type="tel" name="phone" required className="form-input" value={formData.phone} onChange={handleInputChange} dir="ltr" />
            </div>
            
            <div className="form-group">
              <label className="form-label">{t('address')}</label>
              <input type="text" name="address" required className="form-input" value={formData.address} onChange={handleInputChange} />
            </div>
            
            <div className="form-group mb-6">
              <label className="form-label">{t('details')}</label>
              <textarea name="details" className="form-input" rows="3" placeholder={t('details_placeholder')} value={formData.details} onChange={handleInputChange}></textarea>
            </div>

            {/* Paiement */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <label className="form-label font-bold mb-3 block">Mode de paiement (Simulation)</label>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-3 p-3 rounded cursor-pointer border ${paymentMethod === 'cash' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 bg-white'}`}>
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="hidden" />
                  <Wallet size={20} />
                  <span className="font-semibold">Paiement en espèces sur place</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded cursor-pointer border ${paymentMethod === 'card' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 bg-white'}`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
                  <CreditCard size={20} />
                  <span className="font-semibold">Paiement par carte CIB/Edahabia</span>
                </label>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "..." : (paymentMethod === 'card' ? "Payer et " + t('confirm_booking') : t('confirm_booking'))}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Booking;
