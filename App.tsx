
import React, { useState, useEffect, useMemo } from 'react';
import { FlightGroup, PNRStatus, Reminder, AirlineCode, User, UserRole, AirlineConfig, Currency, EmailSettings, UserLog, LogAction } from './types';
import { STATUS_LIST, subtractDays, addDays, getEmailTemplate, DEFAULT_AIRLINES, CURRENCY_SYMBOLS, formatDate } from './constants';
import { ReminderWidget } from './components/ReminderWidget';
import { GroupTable } from './components/GroupTable';
import { Dashboard } from './components/Dashboard';
import { UserGuide } from './components/UserGuide';
import { Plus, Search, LogOut, Plane, X, Save, Mail, Trash2, Bell, ChevronRight, LayoutDashboard, Table as TableIcon, Settings, User as UserIcon, ShieldCheck, Key, Building2, Clock, CheckCircle as CheckCircleIcon, Coins, Globe, Lock, Filter, Download, FileText, CheckSquare, Square, BookOpen, Users, History, ChevronDown, ChevronUp, SearchCode, Calendar } from 'lucide-react';
import { storage } from './api';

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // --- App State ---
  const [groups, setGroups] = useState<FlightGroup[]>([]);
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [airlines, setAirlines] = useState<string[]>([]);
  const [airlineConfigs, setAirlineConfigs] = useState<Record<string, AirlineConfig>>({});
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({ gmailAddress: '', appPassword: '', senderName: 'TAGO System' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState<'table' | 'dashboard' | 'guide'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSelectedAirlines, setExportSelectedAirlines] = useState<string[]>([]);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'users' | 'airlines' | 'email' | 'logs'>('users');
  const [selectedConfigAirline, setSelectedConfigAirline] = useState<AirlineCode>('ET');

  const [newAirlineCode, setNewAirlineCode] = useState('');
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', role: UserRole.VIEWER });
  const [editingUserPermissions, setEditingUserPermissions] = useState<string | null>(null);

  // --- Log Filtering State ---
  const [logSearch, setLogSearch] = useState('');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');
  const [expandedLogYear, setExpandedLogYear] = useState<number | null>(new Date().getFullYear());

  const [editingGroup, setEditingGroup] = useState<FlightGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PNRStatus | 'ALL'>('ALL');
  const [selectedAgency, setSelectedAgency] = useState<string | 'ALL'>('ALL');
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [selectedAirline, setSelectedAirline] = useState<AirlineCode | 'ALL'>('ALL');

  // --- Initial Data Load ---
  // --- Initial Data Load ---
  useEffect(() => {
    const loadData = async () => {
      // Helper to migrate or load
      const initKey = async (key: string, setter: (val: any) => void, defaultVal?: any) => {
        try {
          let data = await storage.get(key);
          if (!data) {
            // Try migration from local storage
            const local = localStorage.getItem(key);
            if (local) {
              data = JSON.parse(local);
              await storage.set(key, data);
            } else if (defaultVal !== undefined) {
              data = defaultVal;
              await storage.set(key, data);
            }
          }
          if (data) setter(data);
        } catch (e) {
          console.error(`Failed to load ${key}`, e);
          if (defaultVal) setter(defaultVal);
        }
      };

      await initKey('flight_groups_v3', setGroups, []);
      await initKey('system_audit_logs_v1', setLogs, []);

      // Airlines specific logic for defaults
      let airlinesData = await storage.get('airline_list_v1');
      if (!airlinesData) {
        const local = localStorage.getItem('airline_list_v1');
        if (local) {
          airlinesData = JSON.parse(local);
        } else {
          airlinesData = DEFAULT_AIRLINES;
        }
        await storage.set('airline_list_v1', airlinesData);
      }
      setAirlines(airlinesData);
      setExportSelectedAirlines(airlinesData);

      await initKey('email_integration_v1', setEmailSettings);

      // Configs
      let configsData = await storage.get('airline_configs_v1');
      if (!configsData) {
        const local = localStorage.getItem('airline_configs_v1');
        if (local) {
          configsData = JSON.parse(local);
        } else {
          configsData = {};
          airlinesData.forEach((al: string) => {
            configsData[al] = {
              airlineCode: al as AirlineCode,
              recipientEmail: '',
              currency: al === 'A2' ? 'EUR' : 'USD',
              reminders: [
                { id: '1', label: 'Deposit Deadline', daysBefore: 66, active: false },
                { id: '2', label: 'Full Payment', daysBefore: 36, active: false },
                { id: '3', label: 'Names Request', daysBefore: 18, active: false }
              ]
            };
          });
        }
        await storage.set('airline_configs_v1', configsData);
      }
      setAirlineConfigs(configsData);

      // Users
      let usersData = await storage.get('system_users');
      if (!usersData) {
        const local = localStorage.getItem('system_users');
        if (local) {
          usersData = JSON.parse(local);
        } else {
          usersData = [{
            id: 'admin-1', username: 'admin', password: 'TalTeufa', role: UserRole.ADMIN, fullName: 'System Administrator',
            allowedAirlines: airlinesData
          }];
        }
        await storage.set('system_users', usersData);
      }
      setUsers(usersData);

      // Session is local only
      const savedSession = localStorage.getItem('current_user_session');
      if (savedSession) {
        try { setCurrentUser(JSON.parse(savedSession)); } catch (e) { setCurrentUser(null); }
      }

      setIsLoaded(true);
    };

    loadData();
  }, []);

  // --- Email Logic ---
  const handleTestConnection = async () => {
    if (!emailSettings.gmailAddress || !emailSettings.appPassword) {
      alert('Please enter Gmail address and App Password');
      return;
    }
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert('Error testing connection: ' + err);
    }
  };

  const sendEmail = async (to: string, subject: string, text: string) => {
    if (!to) {
      alert('No recipient email configured for this airline.');
      return { success: false };
    }
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: emailSettings,
          to,
          subject,
          text
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email: ' + result.message);
      }
      return result;
    } catch (err) {
      console.error(err);
      alert('Error sending email: ' + err);
      return { success: false, message: String(err) };
    }
  };



  // --- Persistence ---
  // --- Persistence ---
  useEffect(() => { if (isLoaded) storage.set('flight_groups_v3', groups); }, [groups, isLoaded]);
  useEffect(() => { if (isLoaded) storage.set('airline_configs_v1', airlineConfigs); }, [airlineConfigs, isLoaded]);
  useEffect(() => { if (isLoaded) storage.set('system_users', users); }, [users, isLoaded]);
  useEffect(() => { if (isLoaded) storage.set('airline_list_v1', airlines); }, [airlines, isLoaded]);
  useEffect(() => { if (isLoaded) storage.set('email_integration_v1', emailSettings); }, [emailSettings, isLoaded]);
  useEffect(() => { if (isLoaded) storage.set('system_audit_logs_v1', logs); }, [logs, isLoaded]);

  // --- Logging Helper ---
  const addLog = (action: LogAction, entityId: string, entityPNR: string, details: string, changes?: UserLog['changes']) => {
    if (!currentUser) return;
    const newLog: UserLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      action,
      entityId,
      entityPNR,
      details,
      changes
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // --- Auth Logic ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username && u.username.toLowerCase() === loginForm.username.toLowerCase() && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('current_user_session', JSON.stringify(user));
      setLoginError('');
    } else setLoginError('Invalid username or password');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user_session');
  };

  const currentUserRole = String(currentUser?.role || '').toUpperCase();
  const canCreate = currentUserRole === 'EDITOR' || currentUserRole === 'ADMIN';
  const isAdmin = currentUserRole === 'ADMIN';

  const userVisibleAirlines = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN) return airlines;
    return (currentUser.allowedAirlines || []).filter(al => airlines.includes(al));
  }, [currentUser, airlines]);

  const uniqueAgencies = useMemo(() => {
    const agencies = new Set<string>();
    groups.forEach(g => {
      if (g.agencyName) agencies.add(g.agencyName);
    });
    return Array.from(agencies).sort();
  }, [groups]);

  const uniqueAgents = useMemo(() => {
    const agents = new Set<string>();
    groups.forEach(g => {
      if (g.agentName) agents.add(g.agentName);
    });
    return Array.from(agents).sort();
  }, [groups]);

  const reminders = useMemo(() => {
    const today = new Date();
    const list: Reminder[] = [];
    groups.forEach(group => {
      if (!userVisibleAirlines.includes(group.airline)) return;
      const depDate = new Date(group.depDate);
      if (group.dateOfferSent && group.status === PNRStatus.PD_PROP_SENT) {
        const fupDate = addDays(new Date(group.dateOfferSent), 7);
        if (fupDate <= addDays(today, 2)) list.push({
          type: 'OFFER_FOLLOWUP', dueDate: fupDate.toISOString(), pnr: group.pnr,
          agency: group.agencyName, description: 'Follow up on agent reply', isOverdue: fupDate < today,
          emailTemplate: getEmailTemplate('OFFER_FOLLOWUP', group)
        });
      }
      const config = airlineConfigs[group.airline];
      if (config) {
        config.reminders.forEach(cr => {
          if (cr.active && cr.label && cr.daysBefore > 0) {
            const triggerDate = subtractDays(depDate, cr.daysBefore);
            if (triggerDate <= addDays(today, 2) && group.status !== PNRStatus.OK_ISSUED && !group.status.startsWith('XX')) {
              list.push({
                type: 'AIRLINE_CUSTOM', dueDate: triggerDate.toISOString(), pnr: group.pnr,
                agency: group.agencyName, description: `${cr.label} (${group.airline})`, isOverdue: triggerDate < today,
                emailTemplate: `Dear ${config.recipientEmail || 'Team'},\n\nReminder for ${cr.label} regarding PNR ${group.pnr}.`
              });
            }
          }
        });
      }
    });
    return list;
  }, [groups, airlineConfigs, userVisibleAirlines]);

  const filteredGroups = useMemo(() => {
    return groups
      .filter(g => {
        if (!userVisibleAirlines.includes(g.airline)) return false;

        const matchesAirline = selectedAirline === 'ALL' || g.airline === selectedAirline;
        const matchesStatus = selectedStatus === 'ALL' || g.status === selectedStatus;
        const matchesAgency = selectedAgency === 'ALL' || g.agencyName === selectedAgency;

        const matchesSearch = (g.pnr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.agencyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.agentName || '').toLowerCase().includes(searchTerm.toLowerCase());

        return matchesAirline && matchesStatus && matchesAgency && matchesSearch;
      })
      .sort((a, b) => new Date(a.depDate).getTime() - new Date(b.depDate).getTime());
  }, [groups, userVisibleAirlines, selectedAirline, selectedStatus, selectedAgency, searchTerm]);

  // --- Scheduling ---
  useEffect(() => {
    if (!isLoaded) return;

    const checkAndSendEmails = async () => {
      const now = new Date();
      const currentHour = now.getHours();

      // Check if it's 10 AM or later
      if (currentHour >= 10) {
        const lastSentDate = localStorage.getItem('last_daily_email_date');
        const todayStr = now.toISOString().split('T')[0];

        if (lastSentDate !== todayStr) {
          console.log('Checking for automated emails...');

          let sentCount = 0;
          for (const reminder of reminders) {
            const group = groups.find(g => g.pnr === reminder.pnr);
            const config = airlineConfigs[group?.airline || ''];
            const recipient = config?.recipientEmail;

            // Check if we already sent this specific reminder today to avoid spam if we reload?
            // For now, relying on the single daily run flag.

            if (recipient) {
              // Send quietly without alerts for each one
              try {
                await fetch('/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    settings: emailSettings,
                    to: recipient,
                    subject: `Reminder: ${reminder.description} - PNR ${reminder.pnr}`,
                    text: reminder.emailTemplate
                  })
                });
                sentCount++;
              } catch (e) {
                console.error("Failed to auto-send email", e);
              }
            }
          }

          if (sentCount > 0) {
            console.log(`Automated Process: ${sentCount} reminder emails have been sent.`);
          }

          localStorage.setItem('last_daily_email_date', todayStr);
        }
      }
    };

    const interval = setInterval(checkAndSendEmails, 60000); // Check every minute
    checkAndSendEmails(); // Check immediately on load

    return () => clearInterval(interval);
  }, [isLoaded, reminders, emailSettings, groups, airlineConfigs]);

  // --- Export Logic ---
  const handleExportCSV = () => {
    const exportGroups = groups.filter(g => exportSelectedAirlines.includes(g.airline));
    if (exportGroups.length === 0) return;

    const headers = [
      'Date Created', 'Airline', 'PNR', 'Agency Name', 'Agent Name',
      'Dep. Date', 'Ret. Date', 'Routing', 'PAX Size', 'Status',
      'Fare', 'Taxes', 'Markup', 'Total Per Pax', 'Remarks'
    ];

    const rows = exportGroups.map(g => {
      const config = airlineConfigs[g.airline];
      const currencySymbol = config ? CURRENCY_SYMBOLS[config.currency] : '$';
      const total = Number(g.fare) + Number(g.taxes) + Number(g.markup);

      return [
        new Date(g.dateCreated).toLocaleDateString('en-GB'),
        g.airline,
        g.pnr,
        `"${g.agencyName.replace(/"/g, '""')}"`,
        `"${(g.agentName || '').replace(/"/g, '""')}"`,
        new Date(g.depDate).toLocaleDateString('en-GB'),
        g.retDate ? new Date(g.retDate).toLocaleDateString('en-GB') : '-',
        `"${g.routing.replace(/"/g, '""')}"`,
        g.size,
        g.status,
        `${currencySymbol}${g.fare}`,
        `${currencySymbol}${g.taxes}`,
        `${currencySymbol}${g.markup}`,
        `${currencySymbol}${total}`,
        `"${(g.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TAGO_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  const handleAddAirline = () => {
    const code = newAirlineCode.trim().toUpperCase();
    if (code && !airlines.includes(code)) {
      setAirlines(prev => [...prev, code]);
      setAirlineConfigs(prev => ({
        ...prev,
        [code]: {
          airlineCode: code,
          recipientEmail: '',
          currency: 'USD',
          reminders: [
            { id: '1', label: 'Deposit Deadline', daysBefore: 66, active: false },
            { id: '2', label: 'Full Payment', daysBefore: 36, active: false },
            { id: '3', label: 'Names Request', daysBefore: 18, active: false }
          ]
        }
      }));
      setNewAirlineCode('');
      setSelectedConfigAirline(code);
    }
  };

  const handleCreateUser = () => {
    if (newUserForm.username.trim() && newUserForm.password.trim()) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: newUserForm.username.trim(),
        password: newUserForm.password,
        role: newUserForm.role,
        fullName: newUserForm.username.trim(),
        // By default, grant new EDITORS and ADMINS access to all airlines to avoid "empty screen" confusion
        allowedAirlines: (newUserForm.role === UserRole.ADMIN || newUserForm.role === UserRole.EDITOR) ? airlines : []
      };
      setUsers(prev => [...prev, newUser]);
      setNewUserForm({ username: '', password: '', role: UserRole.VIEWER });
    }
  };

  const toggleUserAirline = (userId: string, airline: AirlineCode) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const perms = u.allowedAirlines || [];
        const newPerms = perms.includes(airline) ? perms.filter(a => a !== airline) : [...perms, airline];
        return { ...u, allowedAirlines: newPerms };
      }
      return u;
    }));
  };

  const initialFormState: Partial<FlightGroup> = {
    airline: userVisibleAirlines[0] || 'ET', pnr: '', agencyName: '', agentName: '',
    depDate: new Date().toISOString().split('T')[0], retDate: '', routing: '', size: 20, status: PNRStatus.PD_PNR_CREATED,
    remarks: '', fare: 0, taxes: 0, markup: 0,
  };
  const [formData, setFormData] = useState<Partial<FlightGroup>>(initialFormState);

  const handleSave = () => {
    if (editingGroup) {
      // Robust change detection for every field
      const changes: UserLog['changes'] = [];
      const allFields = Object.keys(formData) as (keyof FlightGroup)[];

      allFields.forEach(f => {
        // Skip metadata fields
        if (f === 'id' || f === 'dateCreated' || f === 'dateOfferSent') return;

        const oldVal = editingGroup[f];
        const newVal = formData[f];

        // Normalize values for comparison (handles undefined/null vs empty string)
        const normalizedOld = (oldVal === null || oldVal === undefined) ? '' : String(oldVal).trim();
        const normalizedNew = (newVal === null || newVal === undefined) ? '' : String(newVal).trim();

        if (normalizedOld !== normalizedNew) {
          changes.push({
            field: f.toString(),
            oldValue: oldVal === null || oldVal === undefined ? '-' : oldVal,
            newValue: newVal === null || newVal === undefined ? '-' : newVal
          });
        }
      });

      if (changes.length > 0) {
        addLog(LogAction.UPDATE, editingGroup.id, formData.pnr || editingGroup.pnr, `Updated group information`, changes);
      }

      setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, ...formData } as FlightGroup : g));
    } else {
      const newGroup: FlightGroup = { ...formData, id: Math.random().toString(36).substr(2, 9), dateCreated: new Date().toISOString() } as FlightGroup;
      if (newGroup.status === PNRStatus.PD_PROP_SENT) newGroup.dateOfferSent = new Date().toISOString();

      addLog(LogAction.CREATE, newGroup.id, newGroup.pnr, `Created new group for ${newGroup.agencyName}`);
      setGroups(prev => [newGroup, ...prev]);
    }
    setIsFormOpen(false);
    setEditingGroup(null);
    setFormData(initialFormState);
  };

  const handleDelete = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      addLog(LogAction.DELETE, group.id, group.pnr, `Deleted group for ${group.agencyName}`);
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const updateField = (field: keyof FlightGroup, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  // --- Log Grouping and Filtering ---
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.username.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.entityPNR.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.details.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.action.toLowerCase().includes(logSearch.toLowerCase());

      if (!matchesSearch) return false;

      // Date Range Filtering
      const logDate = new Date(l.timestamp).getTime();
      if (logStartDate) {
        const start = new Date(logStartDate).getTime();
        if (logDate < start) return false;
      }
      if (logEndDate) {
        const end = new Date(logEndDate).setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }

      return true;
    });
  }, [logs, logSearch, logStartDate, logEndDate]);

  const logsByYear = useMemo(() => {
    const grouped: Record<number, UserLog[]> = {};
    filteredLogs.forEach(log => {
      const year = new Date(log.timestamp).getFullYear();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(log);
    });
    return Object.entries(grouped)
      .map(([year, entries]) => ({ year: parseInt(year), entries }))
      .sort((a, b) => b.year - a.year);
  }, [filteredLogs]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <form onSubmit={handleLogin} className="relative bg-white/5 backdrop-blur-2xl border border-white/10 p-12 rounded-[3rem] w-full max-w-md shadow-2xl flex flex-col items-center">
          <div className="bg-blue-600 p-5 rounded-3xl mb-8"><Plane className="w-10 h-10 text-white" /></div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">TAGO</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-10">Group Reservation Hub</p>
          <div className="w-full space-y-6">
            <input type="text" placeholder="Username" className="w-full bg-slate-900/50 border border-slate-800 text-white px-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
            <input type="password" placeholder="Password" className="w-full bg-slate-900/50 border border-slate-800 text-white px-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
            {loginError && <p className="text-rose-500 text-xs font-black text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95">Secure Login</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="ltr">
      <div className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 transition-opacity ${isRemindersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsRemindersOpen(false)}></div>
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[60] transition-transform duration-300 transform ${isRemindersOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setIsRemindersOpen(false)} className="absolute top-6 left-[-3.5rem] bg-white p-3 rounded-l-2xl shadow-xl text-gray-400 hover:text-gray-900 hidden sm:block"><ChevronRight className="w-6 h-6" /></button>
        <ReminderWidget reminders={reminders} onOpenEmail={(r) => setActiveEmail(r.emailTemplate)} onClose={() => setIsRemindersOpen(false)} />
      </aside>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setView('table')}>
            <div className="bg-blue-600 p-2 rounded-xl"><Plane className="w-6 h-6 text-white" /></div>
            <div className="hidden xl:block"><h1 className="font-black text-2xl text-gray-900 tracking-tighter leading-none">TAGO</h1></div>
          </div>

          <div className="flex-1 flex items-center gap-2 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search PNR, Agency..." className="w-full bg-gray-100 border-none rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-1.5 px-3">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase">Status</span>
              </div>
              <select className="bg-white rounded-xl py-1.5 px-3 text-[11px] font-bold border-none outline-none shadow-sm min-w-[140px]" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as any)}>
                <option value="ALL">All Statuses</option>
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
              <select className="bg-white rounded-xl py-1.5 px-3 text-[11px] font-bold border-none outline-none shadow-sm min-w-[140px]" value={selectedAgency} onChange={e => setSelectedAgency(e.target.value)}>
                <option value="ALL">All Agencies</option>
                {uniqueAgencies.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl shrink-0">
            <button onClick={() => setView('table')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}><TableIcon className="w-3.5 h-3.5" /> Table</button>
            <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}><LayoutDashboard className="w-3.5 h-3.5" /> Stats</button>
          </div>

          <nav className="hidden md:flex items-center bg-gray-900 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
            <button onClick={() => setSelectedAirline('ALL')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all min-w-[40px] ${selectedAirline === 'ALL' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>ALL</button>
            {airlines.filter(al => userVisibleAirlines.includes(al)).map(al => (
              <button key={al} onClick={() => setSelectedAirline(al)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all min-w-[40px] ${selectedAirline === al ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>{al}</button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 mr-2">
              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black text-gray-900">{currentUser.username}</span>
                <span className={`text-[8px] font-black uppercase ${currentUser.role === UserRole.ADMIN ? 'text-blue-600' : currentUser.role === UserRole.EDITOR ? 'text-amber-600' : 'text-gray-400'}`}>{currentUser.role}</span>
              </div>
            </div>
            {isAdmin && <button onClick={() => setIsUserMgmtOpen(true)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-100 rounded-full transition-all group"><Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>}
            <button onClick={() => setIsRemindersOpen(true)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-100 rounded-full relative transition-all"><Bell className="w-5 h-5" />{reminders.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}</button>
            <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {view === 'guide' ? (
          <UserGuide />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-3xl font-black text-gray-900 flex items-center gap-4">{view === 'dashboard' ? 'Insight Analytics' : 'Group Inventory'}<span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{filteredGroups.length} Files</span></h2>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button onClick={() => setIsExportModalOpen(true)} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-2xl font-black flex items-center gap-3 shadow-sm transition-all active:scale-95">
                    <Download className="w-5 h-5" /> Export
                  </button>
                )}
                {canCreate && (
                  <button onClick={() => { setFormData({ ...initialFormState, airline: userVisibleAirlines[0] }); setEditingGroup(null); setIsFormOpen(true); }} className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl transition-all active:scale-95">
                    <Plus className="w-5 h-5" /> New Reservation
                  </button>
                )}
              </div>
            </div>
            {view === 'table' ? <GroupTable groups={filteredGroups} airlines={airlines} airlineConfigs={airlineConfigs} onEdit={(g) => { setEditingGroup(g); setFormData({ ...g }); setIsFormOpen(true); }} onDelete={handleDelete} userRole={currentUser.role} /> : <Dashboard groups={filteredGroups} airlines={airlines} />}
          </>
        )}
      </main>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" /> Export to Excel
              </h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 bg-gray-100 p-2 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Airlines</span>
                <button
                  onClick={() => setExportSelectedAirlines(exportSelectedAirlines.length === airlines.length ? [] : airlines)}
                  className="text-blue-600 text-xs font-black"
                >
                  {exportSelectedAirlines.length === airlines.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {airlines.map(al => (
                  <button
                    key={al}
                    onClick={() => {
                      setExportSelectedAirlines(prev =>
                        prev.includes(al) ? prev.filter(x => x !== al) : [...prev, al]
                      );
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${exportSelectedAirlines.includes(al) ? 'bg-blue-50 border-blue-600' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                  >
                    {exportSelectedAirlines.includes(al) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-300" />}
                    <span className={`font-black ${exportSelectedAirlines.includes(al) ? 'text-blue-900' : 'text-gray-500'}`}>{al}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t flex justify-end gap-4">
              <button onClick={() => setIsExportModalOpen(false)} className="px-8 py-4 rounded-2xl font-black text-gray-500">Cancel</button>
              <button
                onClick={handleExportCSV}
                disabled={exportSelectedAirlines.length === 0}
                className={`px-10 py-4 rounded-2xl bg-blue-600 text-white font-black shadow-xl transition-all ${exportSelectedAirlines.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95'}`}
              >
                Download Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forms and Modals */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-2xl font-black">{editingGroup ? 'Edit Group' : 'New Group'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 bg-gray-100 p-2 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <label className="block col-span-1"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Airline</span>
                    <select className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.airline} onChange={e => updateField('airline', e.target.value)}>
                      {userVisibleAirlines.map(al => <option key={al} value={al}>{al}</option>)}
                    </select>
                  </label>
                  <label className="block col-span-1"><span className="text-xs font-black text-gray-400 uppercase block mb-1">PNR</span><input className="w-full rounded-2xl bg-gray-50 p-4 font-black outline-none" value={formData.pnr || ''} onChange={e => updateField('pnr', e.target.value.toUpperCase())} /></label>
                  <label className="block col-span-1"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Seats (PAX)</span><input type="number" className="w-full rounded-2xl bg-gray-50 p-4 font-black outline-none" value={formData.size || ''} onChange={e => updateField('size', parseInt(e.target.value) || 0)} /></label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Dep. Date</span><input type="date" className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.depDate?.split('T')[0] || ''} onChange={e => updateField('depDate', e.target.value)} /></label>
                  <label className="block"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Ret. Date</span><input type="date" className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.retDate?.split('T')[0] || ''} onChange={e => updateField('retDate', e.target.value)} /></label>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <label className="block"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Routing (e.g. TLV-ADD-CPT)</span><input className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.routing || ''} onChange={e => updateField('routing', e.target.value)} /></label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-black text-gray-400 uppercase block mb-1">Agency</span>
                    <input list="agency-suggestions" className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.agencyName || ''} onChange={e => updateField('agencyName', e.target.value)} />
                    <datalist id="agency-suggestions">
                      {uniqueAgencies.map(a => <option key={a} value={a} />)}
                    </datalist>
                  </label>
                  <label className="block">
                    <span className="text-xs font-black text-gray-400 uppercase block mb-1">Agent Name</span>
                    <input list="agent-suggestions" className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.agentName || ''} onChange={e => updateField('agentName', e.target.value)} />
                    <datalist id="agent-suggestions">
                      {uniqueAgents.map(a => <option key={a} value={a} />)}
                    </datalist>
                  </label>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <label className="block"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Fare ({CURRENCY_SYMBOLS[airlineConfigs[formData.airline || '']?.currency || 'USD']})</span><input type="number" className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.fare || ''} onChange={e => updateField('fare', parseFloat(e.target.value) || 0)} /></label>
                  <label className="block"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Tax</span><input type="number" className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.taxes || ''} onChange={e => updateField('taxes', parseFloat(e.target.value) || 0)} /></label>
                  <label className="block"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Markup</span><input type="number" className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.markup || ''} onChange={e => updateField('markup', parseFloat(e.target.value) || 0)} /></label>
                </div>
                <label className="block"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Status</span><select className="w-full rounded-2xl bg-gray-50 p-4 font-bold outline-none" value={formData.status || PNRStatus.PD_PNR_CREATED} onChange={e => updateField('status', e.target.value as PNRStatus)}>{STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
                <label className="block"><span className="text-xs font-black text-gray-400 uppercase block mb-1">Remarks</span><textarea className="w-full rounded-2xl bg-gray-50 p-4 font-medium h-24 resize-none outline-none" value={formData.remarks || ''} onChange={e => updateField('remarks', e.target.value)} /></label>
              </div>
            </div>
            <div className="p-10 bg-gray-50 border-t flex justify-end gap-4"><button onClick={() => setIsFormOpen(false)} className="px-8 py-4 rounded-2xl font-black text-gray-500">Cancel</button><button onClick={handleSave} className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-black shadow-xl">Save Record</button></div>
          </div>
        </div>
      )}

      {isUserMgmtOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-white"><div className="flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-blue-600" /><h3 className="text-2xl font-black">Configuration</h3></div><button onClick={() => setIsUserMgmtOpen(false)} className="text-gray-400 bg-gray-100 p-2 rounded-full"><X className="w-6 h-6" /></button></div>
            <div className="flex border-b bg-gray-50/50">
              <button onClick={() => setAdminTab('users')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${adminTab === 'users' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-400'}`}>Users</button>
              <button onClick={() => setAdminTab('airlines')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${adminTab === 'airlines' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-400'}`}>Airlines & Currency</button>
              <button onClick={() => setAdminTab('email')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${adminTab === 'email' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-400'}`}>Email Integration</button>
              <button onClick={() => setAdminTab('logs')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${adminTab === 'logs' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-400'}`}>System Logs</button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              {adminTab === 'users' ? (
                <div className="space-y-6">
                  {users.map(u => (
                    <div key={u.id} className="flex flex-col gap-4">
                      <div className="bg-gray-50 p-6 rounded-3xl border flex items-center justify-between">
                        <div><p className="font-black text-lg">{u.username}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{u.role}</p></div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingUserPermissions(editingUserPermissions === u.id ? null : u.id)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-xs">Manage Access</button>
                          {u.username !== 'admin' && <button onClick={() => setUsers(prev => prev.filter(usr => usr.id !== u.id))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                        </div>
                      </div>
                      {editingUserPermissions === u.id && (
                        <div className="p-6 bg-white border border-gray-100 rounded-3xl animate-in slide-in-from-top-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-4">Allowed Airlines for {u.username}</p>
                          <div className="flex flex-wrap gap-2">
                            {airlines.map(al => (
                              <button key={al} disabled={u.role === UserRole.ADMIN} onClick={() => toggleUserAirline(u.id, al as AirlineCode)} className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${u.allowedAirlines?.includes(al) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-100'} ${u.role === UserRole.ADMIN ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {al}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pt-8 border-t"><h4 className="text-xs font-black text-gray-400 uppercase mb-4">Register User</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <input placeholder="Username" className="p-4 rounded-2xl border text-sm font-bold bg-gray-50 outline-none" value={newUserForm.username} onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })} />
                      <input type="password" placeholder="Password" className="p-4 rounded-2xl border text-sm font-bold bg-gray-50 outline-none" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} />
                      <select className="p-4 rounded-2xl border text-sm font-bold bg-gray-50 outline-none" value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}>
                        <option value={UserRole.VIEWER}>Viewer</option>
                        <option value={UserRole.EDITOR}>Editor</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                      </select>
                      <button onClick={handleCreateUser} className="bg-gray-900 text-white rounded-2xl font-black text-sm">Add User</button>
                    </div>
                  </div>
                </div>
              ) : adminTab === 'airlines' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1 space-y-2">
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <input placeholder="NEW CODE" className="flex-1 p-2 rounded-xl border text-xs font-black outline-none" value={newAirlineCode} onChange={e => setNewAirlineCode(e.target.value)} />
                        <button onClick={handleAddAirline} className="p-2 bg-blue-600 text-white rounded-xl"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                    {airlines.map(al => (<button key={al} onClick={() => setSelectedConfigAirline(al)} className={`w-full text-left p-4 rounded-2xl font-black text-sm border flex items-center justify-between ${selectedConfigAirline === al ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{al}</button>))}
                  </div>
                  <div className="lg:col-span-3 space-y-8">
                    <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-4 rounded-2xl font-black text-2xl text-blue-600 shadow-sm">{selectedConfigAirline}</div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-black text-blue-500 uppercase mb-1">Currency Configuration</label>
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                              <select className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border-none outline-none font-bold text-gray-800 shadow-sm" value={airlineConfigs[selectedConfigAirline]?.currency || 'USD'} onChange={e => setAirlineConfigs(prev => ({ ...prev, [selectedConfigAirline]: { ...prev[selectedConfigAirline], currency: e.target.value as Currency } }))}>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="ILS">ILS (₪)</option>
                                <option value="GBP">GBP (£)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-blue-500 uppercase mb-1">Airline Email</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" /><input type="email" placeholder="airline@example.com" className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border-none outline-none font-bold text-gray-800 shadow-sm" value={airlineConfigs[selectedConfigAirline]?.recipientEmail || ''} onChange={e => setAirlineConfigs(prev => ({ ...prev, [selectedConfigAirline]: { ...prev[selectedConfigAirline], recipientEmail: e.target.value } }))} /></div>
                          <button onClick={() => sendEmail(airlineConfigs[selectedConfigAirline]?.recipientEmail || '', 'Test Email', 'This is a test email from TAGO.')} className="px-4 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors">Test</button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4" /> Reminders</h4>
                      {airlineConfigs[selectedConfigAirline]?.reminders.map((rem) => (
                        <div key={rem.id} className="grid grid-cols-12 gap-4 items-center bg-gray-50/50 p-4 rounded-2xl border">
                          <div className="col-span-5"><input className="w-full bg-white px-4 py-2 rounded-xl border text-sm font-bold" value={rem.label} onChange={e => setAirlineConfigs(p => ({ ...p, [selectedConfigAirline]: { ...p[selectedConfigAirline], reminders: p[selectedConfigAirline].reminders.map(r => r.id === rem.id ? { ...r, label: e.target.value } : r) } }))} /></div>
                          <div className="col-span-4 flex items-center gap-2"><input type="number" className="w-20 bg-white px-4 py-2 rounded-xl border text-sm font-bold" value={rem.daysBefore} onChange={e => setAirlineConfigs(p => ({ ...p, [selectedConfigAirline]: { ...p[selectedConfigAirline], reminders: p[selectedConfigAirline].reminders.map(r => r.id === rem.id ? { ...r, daysBefore: parseInt(e.target.value) || 0 } : r) } }))} /><span className="text-[10px] font-black text-gray-400 uppercase">Days Before</span></div>
                          <div className="col-span-3"><button onClick={() => setAirlineConfigs(p => ({ ...p, [selectedConfigAirline]: { ...p[selectedConfigAirline], reminders: p[selectedConfigAirline].reminders.map(r => r.id === rem.id ? { ...r, active: !r.active } : r) } }))} className={`w-full py-2 rounded-xl font-black text-xs ${rem.active ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{rem.active ? 'Active' : 'Off'}</button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : adminTab === 'logs' ? (
                <div className="space-y-6">
                  {/* Log Filters */}
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 sticky top-0 z-30">
                    <div className="flex flex-col lg:flex-row items-center gap-4">
                      <div className="relative flex-1 w-full">
                        <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          placeholder="Search keyword (PNR, User, Action...)"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                          value={logSearch}
                          onChange={e => setLogSearch(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-40">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500" />
                          <input
                            type="date"
                            className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-transparent rounded-2xl text-[10px] font-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                            value={logStartDate}
                            onChange={e => setLogStartDate(e.target.value)}
                          />
                        </div>
                        <span className="text-gray-300 font-bold">to</span>
                        <div className="relative flex-1 lg:w-40">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500" />
                          <input
                            type="date"
                            className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-transparent rounded-2xl text-[10px] font-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                            value={logEndDate}
                            onChange={e => setLogEndDate(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => { setLogStartDate(''); setLogEndDate(''); setLogSearch(''); }}
                          className="p-3 bg-gray-100 text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
                          title="Reset Filters"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {logsByYear.length === 0 ? (
                      <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed">
                        <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="font-bold text-gray-400">No logs found for the selected period.</p>
                      </div>
                    ) : (
                      logsByYear.map(yearGroup => (
                        <div key={yearGroup.year} className="space-y-4">
                          <button
                            onClick={() => setExpandedLogYear(expandedLogYear === yearGroup.year ? null : yearGroup.year)}
                            className="w-full flex items-center justify-between p-6 bg-gray-900 text-white rounded-[2rem] shadow-xl"
                          >
                            <div className="flex items-center gap-4">
                              <History className="w-6 h-6 text-blue-400" />
                              <span className="text-xl font-black">{yearGroup.year} Log Archive</span>
                              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase">{yearGroup.entries.length} Entries</span>
                            </div>
                            {expandedLogYear === yearGroup.year ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                          </button>

                          {expandedLogYear === yearGroup.year && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                              {yearGroup.entries.map(log => (
                                <div key={log.id} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${log.action === LogAction.CREATE ? 'bg-emerald-50 text-emerald-600' :
                                        log.action === LogAction.UPDATE ? 'bg-blue-50 text-blue-600' :
                                          'bg-rose-50 text-rose-600'
                                        }`}>
                                        {log.action}
                                      </span>
                                      <div className="h-4 w-px bg-gray-100"></div>
                                      <span className="text-xs font-black text-gray-900">{log.username}</span>
                                      <div className="h-4 w-px bg-gray-100"></div>
                                      <span className="text-xs font-mono font-bold text-blue-600">{log.entityPNR}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                                      <Clock className="w-3 h-3" />
                                      {new Date(log.timestamp).toLocaleDateString('en-GB')} {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 font-medium mb-4">{log.details}</p>

                                  {log.changes && log.changes.length > 0 && (
                                    <div className="bg-gray-50/50 rounded-2xl p-4 space-y-2 border border-dashed">
                                      {log.changes.map((change, idx) => (
                                        <div key={idx} className="flex flex-wrap items-center gap-2 text-[11px]">
                                          <span className="font-black text-gray-400 uppercase tracking-tighter">{change.field}:</span>
                                          <span className="text-gray-500 line-through bg-gray-100 px-1.5 rounded">{String(change.oldValue || '-')}</span>
                                          <ChevronRight className="w-3 h-3 text-gray-300" />
                                          <span className="text-blue-700 font-bold bg-blue-50 px-1.5 rounded">{String(change.newValue || '-')}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex gap-4">
                    <Lock className="w-6 h-6 text-amber-600 shrink-0" />
                    <div className="text-sm">
                      <p className="font-black text-amber-900 mb-1">Gmail SMTP Setup</p>
                      <p className="text-amber-800 font-medium">To send emails via Gmail, you must use an <strong>App Password</strong>. Standard account passwords will not work if 2FA is enabled.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <label className="block space-y-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sender Display Name</span>
                      <input
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. TAGO Notifications"
                        value={emailSettings.senderName}
                        onChange={e => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gmail Address</span>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          className="w-full bg-gray-50 border border-gray-100 pl-12 pr-4 py-4 rounded-2xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="your.account@gmail.com"
                          value={emailSettings.gmailAddress}
                          onChange={e => setEmailSettings({ ...emailSettings, gmailAddress: e.target.value })}
                        />
                      </div>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gmail App Password</span>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          className="w-full bg-gray-50 border border-gray-100 pl-12 pr-4 py-4 rounded-2xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="xxxx xxxx xxxx xxxx"
                          value={emailSettings.appPassword}
                          onChange={e => setEmailSettings({ ...emailSettings, appPassword: e.target.value })}
                        />
                      </div>
                    </label>

                    <div className="pt-2">
                      <button onClick={handleTestConnection} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95">Test Connectivity</button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                    <div className="flex items-center gap-3 text-blue-600 mb-3">
                      <Globe className="w-5 h-5" />
                      <h5 className="font-black text-sm uppercase">Quick Tip</h5>
                    </div>
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      You can generate an App Password in your Google Account settings under <strong>Security {'>'} 2-Step Verification {'>'} App Passwords</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
