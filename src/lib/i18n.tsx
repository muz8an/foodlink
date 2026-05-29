import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "hi" | "kn";

const dict: Record<Lang, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.donate": "Donate Food",
    "nav.browse": "Browse",
    "nav.deliveries": "Deliveries",
    "nav.emergency": "Emergency",
    "nav.notifications": "Alerts",
    "nav.profile": "Profile",
    "nav.signout": "Sign out",
    "nav.signin": "Sign in",
    "tagline": "Connecting Food with Hope",
    "hero.title": "A live network for rescuing surplus food.",
    "hero.sub": "Restaurants, hotels, halls, supermarkets, and households share what's left over. NGOs and volunteers pick it up — in real time, with maps, alerts and proof of delivery.",
    "hero.cta.donor": "Donate food",
    "hero.cta.ngo": "Receive food",
    "stats.meals": "Meals rescued",
    "stats.donors": "Active donors",
    "stats.ngos": "Verified NGOs",
    "stats.cities": "Cities served",
    "auth.signin": "Sign in",
    "auth.signup": "Create account",
    "auth.role": "I am a",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full name",
    "auth.phone": "Phone",
    "auth.org": "Organization (NGO name)",
    "auth.google": "Continue with Google",
    "donate.title": "Share surplus food",
    "donate.foodname": "Food item",
    "donate.qty": "Quantity (e.g. 20 plates)",
    "donate.type": "Food type",
    "donate.expiry": "Best before",
    "donate.addr": "Pickup address",
    "donate.phone": "Contact number",
    "donate.img": "Photo of the food",
    "donate.submit": "Post donation",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.accept": "Accept",
    "common.confirm_pickup": "Confirm pickup",
    "common.confirm_delivery": "Confirm delivery",
  },
  hi: {
    "nav.home": "होम",
    "nav.dashboard": "डैशबोर्ड",
    "nav.donate": "भोजन दान करें",
    "nav.browse": "ब्राउज़ करें",
    "nav.deliveries": "डिलीवरी",
    "nav.emergency": "आपातकाल",
    "nav.notifications": "सूचनाएँ",
    "nav.profile": "प्रोफ़ाइल",
    "nav.signout": "साइन आउट",
    "nav.signin": "साइन इन",
    "tagline": "भोजन को आशा से जोड़ना",
    "hero.title": "अतिरिक्त भोजन बचाने का एक लाइव नेटवर्क।",
    "hero.sub": "रेस्तरां, होटल, हॉल, सुपरमार्केट और घर अतिरिक्त भोजन साझा करते हैं। NGO और स्वयंसेवक उठाते हैं।",
    "hero.cta.donor": "भोजन दान करें",
    "hero.cta.ngo": "भोजन प्राप्त करें",
    "stats.meals": "भोजन बचाया",
    "stats.donors": "सक्रिय दानदाता",
    "stats.ngos": "सत्यापित NGO",
    "stats.cities": "शहर",
    "auth.signin": "साइन इन",
    "auth.signup": "खाता बनाएं",
    "auth.role": "मैं हूँ",
    "auth.email": "ईमेल",
    "auth.password": "पासवर्ड",
    "auth.name": "पूरा नाम",
    "auth.phone": "फ़ोन",
    "auth.org": "संस्था का नाम",
    "auth.google": "Google से जारी रखें",
    "donate.title": "अतिरिक्त भोजन साझा करें",
    "donate.foodname": "भोजन का नाम",
    "donate.qty": "मात्रा",
    "donate.type": "भोजन का प्रकार",
    "donate.expiry": "उपयोग तक",
    "donate.addr": "पिकअप पता",
    "donate.phone": "संपर्क नंबर",
    "donate.img": "भोजन की तस्वीर",
    "donate.submit": "दान पोस्ट करें",
    "common.cancel": "रद्द करें",
    "common.save": "सहेजें",
    "common.accept": "स्वीकार करें",
    "common.confirm_pickup": "पिकअप पुष्टि",
    "common.confirm_delivery": "डिलीवरी पुष्टि",
  },
  kn: {
    "nav.home": "ಮುಖಪುಟ",
    "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "nav.donate": "ಆಹಾರ ದಾನ",
    "nav.browse": "ಬ್ರೌಸ್",
    "nav.deliveries": "ತಲುಪಿಸುವಿಕೆ",
    "nav.emergency": "ತುರ್ತು",
    "nav.notifications": "ಸೂಚನೆಗಳು",
    "nav.profile": "ಪ್ರೊಫೈಲ್",
    "nav.signout": "ಸೈನ್ ಔಟ್",
    "nav.signin": "ಸೈನ್ ಇನ್",
    "tagline": "ಆಹಾರವನ್ನು ಭರವಸೆಯೊಂದಿಗೆ ಜೋಡಿಸುವುದು",
    "hero.title": "ಹೆಚ್ಚಿನ ಆಹಾರ ರಕ್ಷಿಸಲು ಲೈವ್ ನೆಟ್‌ವರ್ಕ್.",
    "hero.sub": "ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು, ಹೋಟೆಲ್‌ಗಳು, ಸಭಾಂಗಣಗಳು, ಸೂಪರ್‌ಮಾರ್ಕೆಟ್‌ಗಳು ಮತ್ತು ಮನೆಗಳು ಉಳಿದ ಆಹಾರ ಹಂಚಿಕೊಳ್ಳುತ್ತವೆ.",
    "hero.cta.donor": "ಆಹಾರ ದಾನ ಮಾಡಿ",
    "hero.cta.ngo": "ಆಹಾರ ಸ್ವೀಕರಿಸಿ",
    "stats.meals": "ಊಟಗಳು ಉಳಿಸಲಾಗಿದೆ",
    "stats.donors": "ಸಕ್ರಿಯ ದಾನಿಗಳು",
    "stats.ngos": "ಪರಿಶೀಲಿಸಿದ NGO",
    "stats.cities": "ನಗರಗಳು",
    "auth.signin": "ಸೈನ್ ಇನ್",
    "auth.signup": "ಖಾತೆ ರಚಿಸಿ",
    "auth.role": "ನಾನು",
    "auth.email": "ಇಮೇಲ್",
    "auth.password": "ಪಾಸ್‌ವರ್ಡ್",
    "auth.name": "ಪೂರ್ಣ ಹೆಸರು",
    "auth.phone": "ಫೋನ್",
    "auth.org": "ಸಂಸ್ಥೆಯ ಹೆಸರು",
    "auth.google": "Google ಮೂಲಕ ಮುಂದುವರಿಸಿ",
    "donate.title": "ಹೆಚ್ಚಿನ ಆಹಾರ ಹಂಚಿಕೊಳ್ಳಿ",
    "donate.foodname": "ಆಹಾರ ಹೆಸರು",
    "donate.qty": "ಪ್ರಮಾಣ",
    "donate.type": "ಆಹಾರ ಪ್ರಕಾರ",
    "donate.expiry": "ಮುಗಿಯುವ ಸಮಯ",
    "donate.addr": "ಪಿಕಪ್ ವಿಳಾಸ",
    "donate.phone": "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ",
    "donate.img": "ಆಹಾರದ ಫೋಟೋ",
    "donate.submit": "ದಾನ ಪೋಸ್ಟ್ ಮಾಡಿ",
    "common.cancel": "ರದ್ದು",
    "common.save": "ಉಳಿಸಿ",
    "common.accept": "ಸ್ವೀಕರಿಸಿ",
    "common.confirm_pickup": "ಪಿಕಪ್ ಖಚಿತಪಡಿಸಿ",
    "common.confirm_delivery": "ತಲುಪಿಸುವಿಕೆ ಖಚಿತಪಡಿಸಿ",
  },
};

const Ctx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("foodlink_lang") as Lang | null;
    if (saved && dict[saved]) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("foodlink_lang", l);
  };

  const t = (k: string) => dict[lang][k] ?? dict.en[k] ?? k;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}