
import React, { useState, useMemo } from 'react';
import { FlightGroup, PNRStatus } from '../types';
import { Users, DollarSign, Plane, TrendingUp, CheckCircle, Clock, Filter, BarChart3, Building2, Download, Settings } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
  groups: FlightGroup[];
  airlines: string[];
}

export const Dashboard: React.FC<DashboardProps> = ({ groups, airlines }) => {
  // --- State for Metric Filtering ---
  const [selectedMetrics, setSelectedMetrics] = useState<{ fare: boolean; taxes: boolean; markup: boolean; pending: boolean }>({
    fare: true,
    taxes: false,
    markup: true, // Default as per request
    pending: false // Default to NOT include pending
  });

  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const ACTIVE_REVENUE_STATUSES = useMemo(() => {
    const baseStatuses = [
      PNRStatus.OK_DEPOSIT_PAID,
      PNRStatus.FULL_PAY_EMD,
      PNRStatus.OK_ISSUED,
      PNRStatus.OK_CONFIRMED
    ];

    if (selectedMetrics.pending) {
      baseStatuses.push(
        PNRStatus.PD_PNR_CREATED,
        PNRStatus.PD_PROP_SENT,
        PNRStatus.PD_UNCONFIRMED,
        PNRStatus.PD_OFFER_SENT
      );
    }
    return baseStatuses;
  }, [selectedMetrics.pending]);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      if (dateRange.start && g.depDate < dateRange.start) return false;
      if (dateRange.end && g.depDate > dateRange.end) return false;
      return true;
    });
  }, [groups, dateRange]);

  const toggleMetric = (key: keyof typeof selectedMetrics) => {
    setSelectedMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateTotal = (group: FlightGroup) => {
    let total = 0;
    if (selectedMetrics.fare) total += Number(group.fare) || 0;
    if (selectedMetrics.taxes) total += Number(group.taxes) || 0;
    if (selectedMetrics.markup) total += Number(group.markup) || 0;
    return total * (Number(group.size) || 0);
  };

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportSections, setExportSections] = useState({
    summaryCards: true,
    statusDistribution: true,
    airlinePerformance: true,
    monthlyRevenue: true,
    topAgencies: true,
    topAirlines: true,
    upcomingDepartures: true,
  });

  const exportSectionLabels: Record<keyof typeof exportSections, string> = {
    summaryCards: 'Summary Cards',
    statusDistribution: 'Status Distribution',
    airlinePerformance: 'Airline Performance',
    monthlyRevenue: 'Monthly Revenue',
    topAgencies: 'Top Agencies',
    topAirlines: 'Top Airlines',
    upcomingDepartures: 'Upcoming Departures',
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    // Add brief delay to ensure menu visually closes before capture
    await new Promise(r => setTimeout(r, 50));

    const element = document.getElementById('dashboard-content');
    if (!element) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const doc = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `tago-dashboard-stats-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Failed to export dashboard as PDF:', error);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalGroups: filteredGroups.length,
      totalPassengers: filteredGroups.reduce((acc, g) => ACTIVE_REVENUE_STATUSES.includes(g.status) ? acc + (Number(g.size) || 0) : acc, 0),
      totalRevenue: filteredGroups.reduce((acc, g) => ACTIVE_REVENUE_STATUSES.includes(g.status) ? acc + calculateTotal(g) : acc, 0),
      activeGroups: filteredGroups.filter(g => g.status.startsWith('OK')).length,
      pendingGroups: filteredGroups.filter(g => g.status.startsWith('PD')).length,
      cancelledGroups: filteredGroups.filter(g => g.status.startsWith('XX')).length,
    };
  }, [filteredGroups, selectedMetrics]);

  // Use airlines from props instead of non-existent AIRLINES constant
  const airlineCounts = useMemo(() => {
    return airlines.map(al => ({
      name: al,
      count: filteredGroups.filter(g => g.airline === al).length,
      passengers: filteredGroups.filter(g => g.airline === al && ACTIVE_REVENUE_STATUSES.includes(g.status)).reduce((acc, g) => acc + (Number(g.size) || 0), 0)
    })).sort((a, b) => b.count - a.count);
  }, [filteredGroups, airlines]);

  const topAgencies = useMemo(() => {
    const agencyMap = new Map<string, { count: number; passengers: number; revenue: number }>();

    filteredGroups.forEach(g => {
      if (!g.agencyName) return;
      // Only sum Revenue/Pax if status matches
      const includeInSums = ACTIVE_REVENUE_STATUSES.includes(g.status);

      const current = agencyMap.get(g.agencyName) || { count: 0, passengers: 0, revenue: 0 };
      agencyMap.set(g.agencyName, {
        count: current.count + 1,
        passengers: current.passengers + (includeInSums ? (Number(g.size) || 0) : 0),
        revenue: current.revenue + (includeInSums ? calculateTotal(g) : 0)
      });
    });

    return Array.from(agencyMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredGroups, selectedMetrics]);

  const topAirlines = useMemo(() => {
    const airlineMap = new Map<string, { count: number; passengers: number; revenue: number }>();

    filteredGroups.forEach(g => {
      if (!g.airline) return;
      const includeInSums = ACTIVE_REVENUE_STATUSES.includes(g.status);

      const current = airlineMap.get(g.airline) || { count: 0, passengers: 0, revenue: 0 };
      airlineMap.set(g.airline, {
        count: current.count + 1,
        passengers: current.passengers + (includeInSums ? (Number(g.size) || 0) : 0),
        revenue: current.revenue + (includeInSums ? calculateTotal(g) : 0)
      });
    });

    return Array.from(airlineMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredGroups, selectedMetrics]);

  const monthlyStats = useMemo(() => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth()
      };
    }).reverse();

    return last12Months.map(m => {
      const monthGroups = filteredGroups.filter(g => {
        const d = new Date(g.depDate);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      });

      return {
        label: m.label,
        revenue: monthGroups.reduce((acc, g) => ACTIVE_REVENUE_STATUSES.includes(g.status) ? acc + calculateTotal(g) : acc, 0),
        passengers: monthGroups.reduce((acc, g) => ACTIVE_REVENUE_STATUSES.includes(g.status) ? acc + (Number(g.size) || 0) : acc, 0)
      };
    });
  }, [filteredGroups, selectedMetrics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10" id="dashboard-content">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Statistics Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            <input type="date" className="bg-gray-50 border-none rounded-lg text-[10px] font-bold py-1 px-2 outline-none" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
            <span className="text-gray-300">-</span>
            <input type="date" className="bg-gray-50 border-none rounded-lg text-[10px] font-bold py-1 px-2 outline-none" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
            {(dateRange.start || dateRange.end) && <button onClick={() => setDateRange({ start: '', end: '' })} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase ml-2">Clear</button>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200" data-html2canvas-ignore="true">
          <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider border-r border-gray-200">
            <Filter className="w-3.5 h-3.5" />
            Calc. Metric
          </div>
          {(['markup', 'fare', 'taxes', 'pending'] as const).map(key => (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${selectedMetrics[key]
                ? (key === 'pending' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-blue-600 text-white shadow-md shadow-blue-200')
                : 'text-gray-400 hover:bg-gray-100'
                }`}
            >
              {key}
            </button>
          ))}
          <div className="flex items-center gap-2 relative" data-html2canvas-ignore="true">
            <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>

            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200 shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Options</span>
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl p-4 z-50 w-56 animate-in fade-in slide-in-from-top-2">
                <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Include in PDF</h6>
                <div className="space-y-2.5">
                  {(Object.keys(exportSections) as Array<keyof typeof exportSections>).map(key => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={exportSections[key]}
                          onChange={() => setExportSections(p => ({ ...p, [key]: !p[key] }))}
                          className="peer sr-only"
                        />
                        <div className="w-4 h-4 rounded-[4px] border border-gray-300 bg-white peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{exportSectionLabels[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" data-html2canvas-ignore={!exportSections.summaryCards ? "true" : undefined}>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="bg-blue-100 p-4 rounded-2xl">
            <Plane className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Groups</p>
            <h4 className="text-2xl font-black text-gray-900">{stats.totalGroups}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="bg-emerald-100 p-4 rounded-2xl">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Pax</p>
            <h4 className="text-2xl font-black text-gray-900">{stats.totalPassengers.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="bg-amber-100 p-4 rounded-2xl">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Value</p>
            <h4 className="text-2xl font-black text-gray-900">${stats.totalRevenue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="bg-indigo-100 p-4 rounded-2xl">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Avg. Group</p>
            <h4 className="text-2xl font-black text-gray-900">
              {stats.totalGroups > 0 ? (stats.totalPassengers / stats.totalGroups).toFixed(1) : 0}
            </h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="bg-purple-100 p-4 rounded-2xl">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Yield / Pax</p>
            <h4 className="text-2xl font-black text-gray-900">
              ${stats.totalPassengers > 0 ? (stats.totalRevenue / stats.totalPassengers).toFixed(2) : 0}
            </h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-html2canvas-ignore={(!exportSections.statusDistribution && !exportSections.airlinePerformance) ? "true" : undefined}>
        {/* Status Breakdown */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 col-span-1" data-html2canvas-ignore={!exportSections.statusDistribution ? "true" : undefined}>
          <h5 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Status Distribution
          </h5>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Confirmed (OK)', value: stats.activeGroups, color: '#10b981' },
                    { name: 'Pending (PD)', value: stats.pendingGroups, color: '#f59e0b' },
                    { name: 'Cancelled (XX)', value: stats.cancelledGroups, color: '#f43f5e' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {
                    [
                      { name: 'Confirmed (OK)', value: stats.activeGroups, color: '#10b981' },
                      { name: 'Pending (PD)', value: stats.pendingGroups, color: '#f59e0b' },
                      { name: 'Cancelled (XX)', value: stats.cancelledGroups, color: '#f43f5e' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))
                  }
                </Pie>
                <RechartsTooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Airline Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 lg:col-span-2" data-html2canvas-ignore={!exportSections.airlinePerformance ? "true" : undefined}>
          <h5 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            Airline Performance
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {airlineCounts.map(al => (
              <div key={al.name} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-gray-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase">{al.name}</span>
                  <span className="text-xs font-black text-blue-600">{al.count} Groups</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">{al.passengers} Pax</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-html2canvas-ignore={(!exportSections.monthlyRevenue && !exportSections.topAgencies && !exportSections.topAirlines) ? "true" : undefined}>
        {/* Monthly Performance Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100" data-html2canvas-ignore={!exportSections.monthlyRevenue ? "true" : undefined}>
          <h5 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Monthly Performance (Revenue)
          </h5>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} tickFormatter={(value) => `$${value / 1000}k`} />
                <RechartsTooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  labelStyle={{ fontWeight: 'black', color: '#111827', marginBottom: '4px' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Agencies */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100" data-html2canvas-ignore={!exportSections.topAgencies ? "true" : undefined}>
          <h5 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            Top Agencies (by Value)
          </h5>
          <div className="space-y-4">
            {topAgencies.map((agency, i) => (
              <div key={agency.name} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-700' : 'bg-blue-200'
                    }`}>
                    {i + 1}
                  </div>
                  <div>
                    <h6 className="text-sm font-bold text-gray-900">{agency.name}</h6>
                    <span className="text-xs font-medium text-gray-500">{agency.passengers} Passengers</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-black text-gray-900">${agency.revenue.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{agency.count} Groups</span>
                </div>
              </div>
            ))}
            {topAgencies.length === 0 && <p className="text-center text-gray-400 py-4">No data available.</p>}
          </div>
        </div>

        {/* Top Airlines */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100" data-html2canvas-ignore={!exportSections.topAirlines ? "true" : undefined}>
          <h5 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            Top Airlines (by Value)
          </h5>
          <div className="space-y-4">
            {topAirlines.map((airline, i) => (
              <div key={airline.name} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-400' : i === 2 ? 'bg-purple-500' : 'bg-gray-300'
                    }`}>
                    {i + 1}
                  </div>
                  <div>
                    <h6 className="text-sm font-black uppercase text-gray-900">{airline.name}</h6>
                    <span className="text-xs font-medium text-gray-500">{airline.passengers} Passengers</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-black text-gray-900">${airline.revenue.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{airline.count} Groups</span>
                </div>
              </div>
            ))}
            {topAirlines.length === 0 && <p className="text-center text-gray-400 py-4">No data available.</p>}
          </div>
        </div>
      </div>

      {/* Recent / Upcoming Activity List in Dashboard */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100" data-html2canvas-ignore={!exportSections.upcomingDepartures ? "true" : undefined}>
        <h5 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Upcoming Departures (Next 30 Days)
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups
            .filter(g => {
              const dep = new Date(g.depDate);
              const now = new Date();
              return dep >= now && dep <= addDays(now, 30);
            })
            .sort((a, b) => new Date(a.depDate).getTime() - new Date(b.depDate).getTime())
            .slice(0, 6)
            .map(g => (
              <div key={g.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="bg-white shadow-sm p-3 rounded-xl border border-gray-100 flex flex-col items-center min-w-[60px]">
                  <span className="text-[10px] font-black text-blue-600 uppercase">{new Date(g.depDate).toLocaleDateString('en-GB', { month: 'short' })}</span>
                  <span className="text-xl font-black text-gray-900">{new Date(g.depDate).getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-blue-600">{g.pnr}</span>
                    <span className="text-[10px] font-black bg-gray-100 px-1.5 py-0.5 rounded">{g.airline}</span>
                  </div>
                  <h6 className="text-sm font-bold text-gray-900 truncate">{g.agencyName}</h6>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{g.routing}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600">{g.size} PAX</span>
                </div>
              </div>
            ))}
          {groups.length === 0 && <p className="text-sm text-gray-400 py-10 text-center col-span-full">No upcoming departures found.</p>}
        </div>
      </div>
    </div>
  );
};

// Helper inside file for date math since we are in a component
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
