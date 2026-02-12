
import React from 'react';
import { FlightGroup, PNRStatus } from '../types';
import { Users, DollarSign, Plane, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface DashboardProps {
  groups: FlightGroup[];
  airlines: string[];
}

export const Dashboard: React.FC<DashboardProps> = ({ groups, airlines }) => {
  const stats = {
    totalGroups: groups.length,
    totalPassengers: groups.reduce((acc, g) => acc + (Number(g.size) || 0), 0),
    totalRevenue: groups.reduce((acc, g) => acc + ((Number(g.fare) + Number(g.taxes)) * (Number(g.size) || 0)), 0),
    activeGroups: groups.filter(g => g.status.startsWith('OK')).length,
    pendingGroups: groups.filter(g => g.status.startsWith('PD')).length,
    cancelledGroups: groups.filter(g => g.status.startsWith('XX')).length,
  };

  // Use airlines from props instead of non-existent AIRLINES constant
  const airlineCounts = airlines.map(al => ({
    name: al,
    count: groups.filter(g => g.airline === al).length,
    passengers: groups.filter(g => g.airline === al).reduce((acc, g) => acc + (Number(g.size) || 0), 0)
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Summary Cards */}
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
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Est. Revenue</p>
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
