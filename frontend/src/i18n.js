import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Dictionnaire des traductions
const resources = {
  fr: {
    translation: {
      "subtitle": "Sanitaire, Plomberie, Chauffage & Froid",
      "emergency": "Urgence Dépannage 24/7",
      "click_call": "Cliquez pour appeler",
      "promo_title": "Promo d'Hiver -20%",
      "promo_desc": "Sur la maintenance de votre chaudière",
      "our_services": "Nos Services",
      "select_domain": "Sélectionnez le domaine d'intervention pour réserver un technicien.",
      "plumbing": "Plomberie Générale",
      "plumbing_desc": "Réparation, installation et entretien de vos installations sanitaires.",
      "heating": "Chaudières et Chauffage",
      "heating_desc": "Dépannage, pose et maintenance de vos systèmes de chauffage.",
      "ac": "Climatisation et Froid",
      "ac_desc": "Installation, réparation et recharge gaz de vos climatiseurs.",
      "form_title": "Remplissez vos coordonnées",
      "fullname": "Nom complet",
      "phone": "Numéro de téléphone",
      "address": "Adresse d'intervention",
      "details": "Détails (Optionnel)",
      "details_placeholder": "Décrivez brièvement le problème...",
      "back": "Retour",
      "confirm_booking": "Confirmer ma demande",
      "success_title": "Demande Envoyée !",
      "success_desc": "Nous avons bien reçu votre demande. Un de nos experts va vous contacter très rapidement sur votre numéro.",
      "back_home": "Retour à l'accueil",
      
      // Client Area
      "login_title": "Connexion",
      "register_title": "Créer un compte",
      "access_account": "Accédez à votre espace client",
      "password": "Mot de passe",
      "login_btn": "Se connecter",
      "register_btn": "S'inscrire",
      "no_account": "Pas encore de compte ?",
      "has_account": "Déjà un compte ?",
      "client_area": "Espace Client",
      "hello": "Bonjour",
      "tracking": "Suivi & Historique",
      "no_reservations": "Aucune réservation pour le moment.",
      "leave_review": "Laisser un avis",
      "rate_intervention": "Évaluer l'intervention",
      "cancel": "Annuler",
      "send": "Envoyer",
      "notifications": "Notifications",
      "my_profile": "Mon Profil",
      "manage_addresses": "Gérer mes adresses",
      "logout": "Se déconnecter",
      "tab_tracking": "Suivi",
      "tab_profile": "Profil"
    }
  },
  ar: {
    translation: {
      "subtitle": "صرف صحي، ترصيص، تدفئة وتبريد",
      "emergency": "تدخل سريع 24/7",
      "click_call": "اضغط للاتصال",
      "promo_title": "تخفيض الشتاء -20%",
      "promo_desc": "على صيانة سخانك",
      "our_services": "خدماتنا",
      "select_domain": "اختر مجال التدخل لحجز تقني.",
      "plumbing": "ترصيص عام",
      "plumbing_desc": "إصلاح، تركيب وصيانة منشآتك الصحية.",
      "heating": "تدفئة وسخانات",
      "heating_desc": "إصلاح، تركيب وصيانة أنظمة التدفئة الخاصة بك.",
      "ac": "تبريد وتكييف",
      "ac_desc": "تركيب، إصلاح وشحن غاز المكيفات.",
      "form_title": "املأ بياناتك",
      "fullname": "الاسم الكامل",
      "phone": "رقم الهاتف",
      "address": "عنوان التدخل",
      "details": "تفاصيل (اختياري)",
      "details_placeholder": "صف المشكلة باختصار...",
      "back": "رجوع",
      "confirm_booking": "تأكيد الطلب",
      "success_title": "تم إرسال الطلب!",
      "success_desc": "لقد تلقينا طلبك بنجاح. سيتصل بك أحد خبرائنا قريبًا على رقمك.",
      "back_home": "العودة للرئيسية",
      
      // Client Area
      "login_title": "تسجيل الدخول",
      "register_title": "إنشاء حساب",
      "access_account": "ادخل إلى مساحة الزبون",
      "password": "كلمة المرور",
      "login_btn": "دخول",
      "register_btn": "تسجيل",
      "no_account": "ليس لديك حساب؟",
      "has_account": "لديك حساب بالفعل؟",
      "client_area": "مساحة الزبون",
      "hello": "مرحباً",
      "tracking": "تتبع وسجل",
      "no_reservations": "لا يوجد حجوزات حالياً.",
      "leave_review": "اترك تقييم",
      "rate_intervention": "تقييم التدخل",
      "cancel": "إلغاء",
      "send": "إرسال",
      "notifications": "الإشعارات",
      "my_profile": "حسابي",
      "manage_addresses": "إدارة عناويني",
      "logout": "تسجيل الخروج",
      "tab_tracking": "تتبع",
      "tab_profile": "حسابي"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr", // Langue par défaut
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
