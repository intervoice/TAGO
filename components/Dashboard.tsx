
import React, { useState, useMemo } from 'react';
import { FlightGroup, PNRStatus } from '../types';
import { Users, DollarSign, Plane, TrendingUp, CheckCircle, Clock, Filter, BarChart3, Building2 } from 'lucide-react';

interface DashboardProps {
  groups: FlightGroup[];
  airlines: string[];
}

export const Dashboard: React.FC<DashboardProps> = ({ groups, airlines }) => {
  // --- State for Metric Filtering ---
  const [selectedMetrics, setSelectedMetrics] = useState<{ fare: boolean; taxes: boolean; markup: boolean }>({
    fare: true,
    taxes: false,
    markup: true // Default as per request
  });

  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const REVENUE_STATUSES = [
    PNRStatus.OK_COMMITTED,
    PNRStatus.OK_DEPOSIT_PAID,
    PNRStatus.FULL_PAY_EMD,
    PNRStatus.OK_ISSUED,
    PNRStatus.OK_CONFIRMED // Added new status
  ];

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

  const stats = useMemo(() => {
    return {
      totalGroups: filteredGroups.length,
      totalPassengers: filteredGroups.reduce((acc, g) => REVENUE_STATUSES.includes(g.status) ? acc + (Number(g.size) || 0) : acc, 0),
      totalRevenue: filteredGroups.reduce((acc, g) => REVENUE_STATUSES.includes(g.status) ? acc + calculateTotal(g) : acc, 0),
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
      passengers: filteredGroups.filter(g => g.airline === al && REVENUE_STATUSES.includes(g.status)).reduce((acc, g) => acc + (Number(g.size) || 0), 0)
    })).sort((a, b) => b.count - a.count);
  }, [filteredGroups, airlines]);

  const topAgencies = useMemo(() => {
    const agencyMap = new Map<string, { count: number; passengers: number; revenue: number }>();

    filteredGroups.forEach(g => {
      if (!g.agencyName) return;
      // Only sum Revenue/Pax if status matches
      const includeInSums = REVENUE_STATUSES.includes(g.status);

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
        revenue: monthGroups.reduce((acc, g) => REVENUE_STATUSES.includes(g.status) ? acc + calculateTotal(g) : acc, 0),
        passengers: monthGroups.reduce((acc, g) => REVENUE_STATUSES.includes(g.status) ? acc + (Number(g.size) || 0) : acc, 0)
      };
    });
  }, [filteredGroups, selectedMetrics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
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

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
          <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider border-r border-gray-200">
            <Filter className="w-3.5 h-3.5" />
            Calc. Metric
          </div>
          {(['markup', 'fare', 'taxes'] as const).map(key => (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${selectedMetrics[key]
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-gray-400 hover:bg-gray-100'
                }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Breakdown */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 col-span-1">
          <h5 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Status Distribution
          </h5>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-emerald-600">
                <span>Confirmed (OK)</span>
                <span>{stats.activeGroups}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${stats.totalGroups > 0 ? (stats.activeGroups / stats.totalGroups) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-amber-600">
                <span>Pending (PD)</span>
                <span>{stats.pendingGroups}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${stats.totalGroups > 0 ? (stats.pendingGroups / stats.totalGroups) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-rose-600">
                <span>Cancelled (XX)</span>
                <span>{stats.cancelledGroups}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${stats.totalGroups > 0 ? (stats.cancelledGroups / stats.totalGroups) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Airline Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 lg:col-span-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Performance Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h5 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Monthly Performance (Revenue)
          </h5>
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyStats.map((m, i) => {
              // Calculate max for scaling (rough)
              const maxVal = Math.max(...monthlyStats.map(x => x.revenue));
              const heightPct = maxVal > 0 ? (m.revenue / maxVal) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-gray-100 rounded-t-xl relative overflow-hidden group-hover:bg-gray-200 transition-colors h-full flex items-end">
                    <div
                      className="w-full bg-indigo-500 rounded-t-xl transition-all duration-1000 opacity-80 group-hover:opacity-100"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{m.label}</span>
                  {/* Tooltip-ish value on hover could go here, for now just static bars */}
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Agencies */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
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
      </div>

      {/* Recent / Upcoming Activity List in Dashboard */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
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
