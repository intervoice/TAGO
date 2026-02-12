
import React, { useState } from 'react';
import { 
  Plane, 
  LayoutDashboard, 
  Table as TableIcon, 
  Download, 
  Bell, 
  Settings, 
  ShieldCheck, 
  Printer, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  DollarSign,
  UserCheck,
  Mail,
  Languages,
  ChevronLeft
} from 'lucide-react';

type Language = 'en' | 'he';

export const UserGuide: React.FC = () => {
  const [lang, setLang] = useState<Language>('he');

  const handlePrint = () => {
    window.print();
  };

  const isRtl = lang === 'he';

  const content = {
    en: {
      title: "TAGO",
      subtitle: "Tal Aviation Group Operations",
      version: "Version 3.5 | Official Comprehensive Manual",
      print: "Save as PDF / Print",
      langToggle: "עברית",
      sections: {
        intro: {
          title: "1. Introduction",
          p1: "Welcome to the TAGO platform. This system is a centralized hub specifically designed for the operations teams at TAL Aviation Group to manage the complex lifecycle of group flight reservations.",
          p2: "TAGO eliminates manual tracking by providing automated financial calculations, deadline reminders, and standardized reporting tools."
        },
        analytics: {
          title: "2. Analytics & Insights",
          desc: "The Dashboard serves as your mission control, providing a real-time snapshot of the entire operations floor:",
          card1: { title: "Revenue Tracking", desc: "Automatically aggregates potential and confirmed revenue based on your inputs." },
          card2: { title: "Status Distribution", desc: "Visualizes the pipeline: Pending, Confirmed, and Cancelled." }
        },
        lifecycle: {
          title: "3. Reservation Lifecycle",
          step1: { title: "Initiating a Booking", desc: "Click the 'New Reservation' button. A side modal will appear containing all required fields.", detail1: "Airlines & PNR: Select from the list and enter GDS PNR.", detail2: "Agency Details: Select existing agencies or type new ones." },
          step2: { title: "Financial Setup", desc: "The system automatically calculates totals based on three core inputs:", net: "NET", tax: "YQ / TAX", profit: "AG PROFIT" },
          step3: { title: "Setting the Status", desc: "Choose the current stage. This determines tasks and stats.", pd: "PD: PNR CREATED", ok1: "OK: DEPOSIT PAID", ok2: "OK: ISSUED" }
        },
        inventory: {
          title: "4. Inventory Control",
          filterTitle: "Power Filtering",
          filterDesc: "Use top-row filter inputs to narrow down data instantly by PNR, Agency, Airline, or Status.",
          customTitle: "Display Customization",
          customDesc: "Switch between 50, 100, 200, or ALL records. Use pagination to jump between pages."
        },
        reminders: {
          title: "5. Automated Reminders",
          desc: "The Pending Tasks sidebar is your safety net. It automatically flags:",
          deadline: { title: "Standard Deadlines", desc: "Tracking for 66 days (Deposit), 36 days (Full Pay), and 18 days (Names)." },
          emails: { title: "Draft Emails", desc: "Click 'Draft' to get a pre-filled email template for the agency or airline." }
        },
        admin: {
          title: "6. Exporting & Admin",
          export: { title: "Data Export", desc: "Admins can export all visible data to Excel (CSV) for audit trails." },
          perms: { title: "User Permissions", desc: "Manage airline-specific access. Restrict editors to specific brands for privacy." }
        }
      },
      footer: "Operations Management Hub",
      creator: "System created by Oren Saban"
    },
    he: {
      title: "TAGO",
      subtitle: "מחלקת מבצעים - TAL Aviation Group",
      version: "גרסה 3.5 | מדריך משתמש רשמי ומקיף",
      print: "שמור כ-PDF / הדפסה",
      langToggle: "English",
      sections: {
        intro: {
          title: "1. הקדמה",
          p1: "ברוכים הבאים לפלטפורמת TAGO. מערכת זו מהווה מוקד מרכזי שתוכנן במיוחד עבור צוותי המבצעים ב-TAL Aviation Group לניהול מחזור החיים המורכב של הזמנות טיסה קבוצתיות.",
          p2: "TAGO מבטלת את הצורך במעקב ידני על ידי אספקת חישובים פיננסיים אוטומטיים, תזכורות למועדי תשלום וכלי דיווח סטנדרטיים."
        },
        analytics: {
          title: "2. נתונים ותובנות",
          desc: "לוח הבקרה (Dashboard) משמש כמרכז השליטה שלך, ומספק תמונת מצב בזמן אמת של כל פעילות המחלקה:",
          card1: { title: "מעקב הכנסות", desc: "מרכז אוטומטית הכנסות פוטנציאליות ומאושרות על סמך הקלטים שלך." },
          card2: { title: "התפלגות סטטוסים", desc: "ויזואליזציה של הצנרת: הזמנות בטיפול, הזמנות מאושרות והזדמנויות שבוטלו." }
        },
        lifecycle: {
          title: "3. מחזור חיי ההזמנה",
          step1: { title: "יצירת הזמנה חדשה", desc: "לחץ על כפתור 'New Reservation'. ייפתח חלון צדדי המכיל את כל שדות החובה.", detail1: "חברת תעופה ו-PNR: בחר מהרשימה והזן את ה-PNR מה-GDS.", detail2: "פרטי סוכן: בחר סוכנות קיימת או הקלד חדשה (המערכת תציע השלמה אוטומטית)." },
          step2: { title: "הגדרות פיננסיות", desc: "המערכת מחשבת אוטומטית את הסכומים על סמך שלושה נתוני ליבה:", net: "מחיר נטו", tax: "מיסים", profit: "רווח סוכן" },
          step3: { title: "קביעת סטטוס", desc: "בחר את השלב הנוכחי של ההזמנה. זה יקבע את המשימות והסטטיסטיקות.", pd: "PD: נוצר PNR", ok1: "OK: שולם פיקדון", ok2: "OK: הונפקו כרטיסים" }
        },
        inventory: {
          title: "4. ניהול מלאי",
          filterTitle: "סינון עוצמתי",
          filterDesc: "השתמש בשורת הסינון בראש הטבלה כדי לצמצם נתונים באופן מיידי לפי PNR, סוכנות, חברת תעופה או סטטוס.",
          customTitle: "התאמת תצוגה",
          customDesc: "בחר בין הצגת 50, 100, 200 או כל הרשומות. השתמש בכפתורי הניווט למעבר בין דפים."
        },
        reminders: {
          title: "5. תזכורות אוטומטיות",
          desc: "סרגל המשימות הממתינות (אייקון הפעמון) הוא רשת הביטחון שלך. הוא מתריע אוטומטית על:",
          deadline: { title: "מועדי תשלום (Deadlines)", desc: "מעקב ל-66 יום (פיקדון), 36 יום (תשלום מלא) ו-18 יום (שמות) לפני היציאה." },
          emails: { title: "טיוטות אימייל", desc: "לחץ על 'Draft' בכל משימה כדי לקבל תבנית אימייל מוכנה לסוכנות או לחברת התעופה." }
        },
        admin: {
          title: "6. ייצוא וניהול מערכת",
          export: { title: "ייצוא נתונים", desc: "מנהלים יכולים לייצא את כל הנתונים המוצגים לקובץ אקסל (CSV) לצורכי ביקורת." },
          perms: { title: "הרשאות משתמש", desc: "ניהול גישה לפי חברת תעופה. ניתן להגביל עורכים למותגים ספציפיים לשמירה על פרטיות." }
        }
      },
      footer: "מרכז ניהול מבצעים",
      creator: "המערכת נוצרה על ידי אורן סבן"
    }
  };

  const t = content[lang];

  return (
    <div className={`bg-white min-h-screen p-8 md:p-16 max-w-5xl mx-auto shadow-2xl rounded-[3rem] my-8 print:shadow-none print:my-0 print:p-0 transition-all duration-500 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className={`flex flex-col md:flex-row justify-between items-start border-b-4 border-blue-600 pb-8 mb-12 gap-8`}>
        <div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-2">{t.title}</h1>
          <p className="text-blue-600 font-black uppercase tracking-widest text-sm">{t.subtitle}</p>
          <p className="text-gray-400 font-bold text-xs mt-1">{t.version}</p>
        </div>
        <div className={`flex flex-col gap-3 ${isRtl ? 'md:items-start' : 'md:items-end'}`}>
          <div className="bg-blue-600 p-5 rounded-[2rem] inline-block shadow-lg">
            <Plane className="w-12 h-12 text-white" />
          </div>
          <div className="flex gap-2 print:hidden">
            <button 
              onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-xs font-black hover:bg-blue-100 transition-all shadow-sm"
            >
              <Languages className="w-4 h-4" /> {t.langToggle}
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-gray-800 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" /> {t.print}
            </button>
          </div>
        </div>
      </div>

      {/* 1. Introduction */}
      <section className="mb-16">
        <div className={`flex items-center gap-3 mb-6 ${isRtl ? 'flex-row' : 'flex-row'}`}>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><ShieldCheck className="w-6 h-6" /></div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t.sections.intro.title}</h2>
        </div>
        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
          <p className="text-gray-600 leading-relaxed font-medium mb-4">{t.sections.intro.p1}</p>
          <p className="text-gray-600 leading-relaxed font-medium">{t.sections.intro.p2}</p>
        </div>
      </section>

      {/* 2. Analytics */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><LayoutDashboard className="w-6 h-6" /></div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t.sections.analytics.title}</h2>
        </div>
        <p className="text-gray-600 mb-6 font-medium">{t.sections.analytics.desc}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-100 rounded-3xl bg-white shadow-sm">
            <h4 className="font-black text-gray-900 mb-2 flex items-center gap-2">
              <DollarSign className={`w-4 h-4 text-emerald-500 ${isRtl ? 'ml-2' : 'mr-2'}`} /> 
              {t.sections.analytics.card1.title}
            </h4>
            <p className="text-sm text-gray-500 font-medium">{t.sections.analytics.card1.desc}</p>
          </div>
          <div className="p-6 border border-gray-100 rounded-3xl bg-white shadow-sm">
            <h4 className="font-black text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 text-blue-500 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t.sections.analytics.card2.title}
            </h4>
            <p className="text-sm text-gray-500 font-medium">{t.sections.analytics.card2.desc}</p>
          </div>
        </div>
      </section>

      {/* 3. Lifecycle */}
      <section className="mb-16 page-break-before">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><PlusCircle className="w-6 h-6" /></div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t.sections.lifecycle.title}</h2>
        </div>
        
        <div className="space-y-12">
          {/* Step 1 */}
          <div className={`relative ${isRtl ? 'pr-12' : 'pl-12'}`}>
            <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-sm`}>1</div>
            <h3 className="text-xl font-black text-gray-900 mb-3">{t.sections.lifecycle.step1.title}</h3>
            <p className="text-sm text-gray-600 font-medium mb-4">{t.sections.lifecycle.step1.desc}</p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm font-medium text-gray-500 items-start">
                {isRtl ? <ChevronLeft className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />}
                <span>{t.sections.lifecycle.step1.detail1}</span>
              </li>
              <li className="flex gap-3 text-sm font-medium text-gray-500 items-start">
                {isRtl ? <ChevronLeft className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />}
                <span>{t.sections.lifecycle.step1.detail2}</span>
              </li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className={`relative ${isRtl ? 'pr-12' : 'pl-12'}`}>
            <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-sm`}>2</div>
            <h3 className="text-xl font-black text-gray-900 mb-3">{t.sections.lifecycle.step2.title}</h3>
            <p className="text-sm text-gray-600 font-medium mb-4">{t.sections.lifecycle.step2.desc}</p>
            <div className="bg-gray-50 p-6 rounded-2xl grid grid-cols-3 gap-4 border border-gray-100">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t.sections.lifecycle.step2.net}</p>
                <p className="text-lg font-black text-gray-900">NET</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t.sections.lifecycle.step2.tax}</p>
                <p className="text-lg font-black text-gray-900">YQ / TAX</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t.sections.lifecycle.step2.profit}</p>
                <p className="text-lg font-black text-gray-900">AG PROFIT</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`relative ${isRtl ? 'pr-12' : 'pl-12'}`}>
            <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-sm`}>3</div>
            <h3 className="text-xl font-black text-gray-900 mb-3">{t.sections.lifecycle.step3.title}</h3>
            <p className="text-sm text-gray-600 font-medium mb-4">{t.sections.lifecycle.step3.desc}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border-2 border-amber-100 bg-amber-50 text-amber-700 text-xs font-black">{t.sections.lifecycle.step3.pd}</div>
              <div className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-700 text-xs font-black">{t.sections.lifecycle.step3.ok1}</div>
              <div className="p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-black">{t.sections.lifecycle.step3.ok2}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Inventory Control */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TableIcon className="w-6 h-6" /></div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t.sections.inventory.title}</h2>
        </div>
        <div className="space-y-6">
          <div>
            <h4 className="font-black text-gray-900 mb-2">{t.sections.inventory.filterTitle}</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{t.sections.inventory.filterDesc}</p>
          </div>
          <div>
            <h4 className="font-black text-gray-900 mb-2">{t.sections.inventory.customTitle}</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{t.sections.inventory.customDesc}</p>
          </div>
        </div>
      </section>

      {/* 5. Reminders */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Bell className="w-6 h-6" /></div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t.sections.reminders.title}</h2>
        </div>
        <p className="text-gray-600 mb-6 font-medium">{t.sections.reminders.desc}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <AlertCircle className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <h5 className="font-black text-gray-900 mb-1">{t.sections.reminders.deadline.title}</h5>
              <p className="text-xs text-gray-500 font-medium">{t.sections.reminders.deadline.desc}</p>
            </div>
          </div>
          <div className="flex gap-4 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <Mail className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <h5 className="font-black text-gray-900 mb-1">{t.sections.reminders.emails.title}</h5>
              <p className="text-xs text-gray-500 font-medium">{t.sections.reminders.emails.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Admin & Export */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Settings className="w-6 h-6" /></div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t.sections.admin.title}</h2>
        </div>
        <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-black mb-4 flex items-center gap-2">
                <Download className={`w-5 h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} /> 
                {t.sections.admin.export.title}
              </h4>
              <p className="text-gray-400 text-sm font-medium mb-4">{t.sections.admin.export.desc}</p>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase">
                <CheckCircle2 className="w-4 h-4" /> Official Audit Ready
              </div>
            </div>
            <div>
              <h4 className="text-xl font-black mb-4 flex items-center gap-2">
                <UserCheck className={`w-5 h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t.sections.admin.perms.title}
              </h4>
              <p className="text-gray-400 text-sm font-medium">{t.sections.admin.perms.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <div className="mt-20 pt-12 border-t border-gray-100 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
           <Plane className="w-5 h-5 text-blue-600" />
           <span className="text-lg font-black text-gray-900 uppercase">TAL AVIATION GROUP</span>
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4">{t.footer}</p>
        <div className="bg-gray-50 px-6 py-2 rounded-full border border-gray-100">
           <p className="text-[9px] text-gray-400 font-bold italic tracking-wider">{t.creator}</p>
        </div>
      </div>
    </div>
  );
};
