
import React, { useState, useMemo, useEffect } from 'react';
import { FlightGroup, PNRStatus, UserRole, AirlineConfig } from '../types';
import { formatDate, STATUS_LIST, CURRENCY_SYMBOLS } from '../constants';
import { Edit2, Trash2, X, Lock, Check, ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { DateInput } from './DateInput';

interface GroupTableProps {
  groups: FlightGroup[];
  airlineConfigs: Record<string, AirlineConfig>;
  airlines: string[];
  onEdit: (group: FlightGroup) => void;
  onDelete: (id: string) => void;
  userRole: UserRole;
}

export const GroupTable: React.FC<GroupTableProps> = ({ groups, airlineConfigs, airlines, onEdit, onDelete, userRole }) => {
  const [filters, setFilters] = useState({
    pnr: '',
    agency: '',
    airline: '',
    status: '',
    routing: '',
    agent: '',
    startDate: '',
    endDate: ''
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Robust permission check
  const currentRoleStr = String(userRole || '').toUpperCase();
  const canEdit = currentRoleStr === 'EDITOR' || currentRoleStr === 'ADMIN';
  const canDelete = currentRoleStr === 'ADMIN';

  // Apply filters first
  const filtered = useMemo(() => {
    return groups.filter(g =>
      g.pnr.toLowerCase().includes(filters.pnr.toLowerCase()) &&
      g.agencyName.toLowerCase().includes(filters.agency.toLowerCase()) &&
      (g.agentName || '').toLowerCase().includes(filters.agent.toLowerCase()) &&
      (filters.airline === '' || g.airline === filters.airline) &&
      (filters.status === '' || g.status === filters.status) &&
      g.routing.toLowerCase().includes(filters.routing.toLowerCase()) &&
      (!filters.startDate || g.depDate >= filters.startDate) &&
      (!filters.endDate || g.depDate <= filters.endDate)
    );
  }, [groups, filters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  // Handle Pagination logic
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filtered.length / pageSize);
  const paginatedGroups = useMemo(() => {
    if (pageSize === 'ALL') return filtered;
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const startIndex = pageSize === 'ALL' ? 1 : (currentPage - 1) * pageSize + 1;
  const endIndex = pageSize === 'ALL' ? filtered.length : Math.min(currentPage * pageSize, filtered.length);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pagination Controls Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-xl">
            <ListFilter className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Display Mode</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-gray-100 border-none rounded-lg text-xs font-black px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value="ALL">All Records</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Progress</p>
            <p className="text-xs font-bold text-gray-600">
              Showing <span className="text-blue-600">{filtered.length > 0 ? startIndex : 0}</span> to <span className="text-blue-600">{endIndex}</span> of <span className="text-gray-900">{filtered.length}</span> results
            </p>
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-lg transition-all ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center px-2 gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (totalPages <= 5) pageNum = i + 1;
                  else {
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-black transition-all ${currentPage === pageNum ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-lg transition-all ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[2000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-20">Created</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-16 text-center">AL</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-24">PNR</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-36">Agency</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-32">Agent</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-28 text-center bg-blue-50/50">Dep. Date</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-28 text-center">Ret. Date</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-28 text-center">Rec. Agent</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-28 text-center">Sent to AL</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-24">Routing</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-24 text-center">Size</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-20 text-center">Deposit</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-20 text-center">Full Pay</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-20 text-center">Names</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-40">Status</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-20 text-right">Fare</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-20 text-right">Tax</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-20 text-right">Markup</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-24 text-right bg-blue-50/30">Total</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-40">Remarks</th>
                <th className="p-3 text-[11px] font-bold text-gray-500 uppercase w-32">Actions</th>
              </tr>
              <tr className="bg-white border-b border-gray-50">
                <td className="p-2"></td>
                <td className="p-2">
                  <select className="w-full text-[10px] p-1 border rounded bg-gray-50 outline-none" value={filters.airline} onChange={(e) => handleFilterChange('airline', e.target.value)}><option value="">All</option>{airlines.map(al => <option key={al} value={al}>{al}</option>)}</select>
                </td>
                <td className="p-2"><input className="w-full text-[10px] p-1 border rounded bg-gray-50 outline-none" placeholder="PNR" value={filters.pnr} onChange={(e) => handleFilterChange('pnr', e.target.value)} /></td>
                <td className="p-2"><input className="w-full text-[10px] p-1 border rounded bg-gray-50 outline-none" placeholder="Agency" value={filters.agency} onChange={(e) => handleFilterChange('agency', e.target.value)} /></td>
                <td className="p-2"><input className="w-full text-[10px] p-1 border rounded bg-gray-50 outline-none" placeholder="Agent" value={filters.agent} onChange={(e) => handleFilterChange('agent', e.target.value)} /></td>
                <td className="p-2">
                  <div className="flex flex-col gap-1">
                    <DateInput className="w-full text-[9px] p-0.5 border rounded bg-gray-50 outline-none" placeholder="From" value={filters.startDate} onChange={(val) => handleFilterChange('startDate', val)} />
                    <DateInput className="w-full text-[9px] p-0.5 border rounded bg-gray-50 outline-none" placeholder="To" value={filters.endDate} onChange={(val) => handleFilterChange('endDate', val)} />
                  </div>
                </td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"><input className="w-full text-[10px] p-1 border rounded bg-gray-50 outline-none" placeholder="Route" value={filters.routing} onChange={(e) => handleFilterChange('routing', e.target.value)} /></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"><select className="w-full text-[10px] p-1 border rounded bg-gray-50 outline-none" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}><option value="">All Statuses</option>{STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2 text-right">
                  {(filters.pnr || filters.agency || filters.airline || filters.status || filters.routing || filters.agent || filters.startDate || filters.endDate) && (
                    <button onClick={() => setFilters({ pnr: '', agency: '', airline: '', status: '', routing: '', agent: '', startDate: '', endDate: '' })} className="p-1 hover:text-red-500 flex items-center gap-1 text-[10px] font-black uppercase ml-auto"><X className="w-3 h-3" /> Clear</button>
                  )}
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan={21} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <ListFilter className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-400 font-bold">No matching records found</p>
                      <button
                        onClick={() => setFilters({ pnr: '', agency: '', airline: '', status: '', routing: '', agent: '', startDate: '', endDate: '' })}
                        className="text-xs text-blue-600 font-black uppercase hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((group) => {
                  const fare = Number(group.fare) || 0;
                  const tax = Number(group.taxes) || 0;
                  const markup = Number(group.markup) || 0;
                  const totalPP = fare + tax + markup;
                  const isConfirming = confirmDeleteId === group.id;
                  const currency = airlineConfigs[group.airline]?.currency || 'USD';
                  const symbol = CURRENCY_SYMBOLS[currency];

                  return (
                    <tr key={group.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="p-3 text-[11px] text-gray-400">{formatDate(group.dateCreated)}</td>
                      <td className="p-3 text-center">
                        <span className="font-black text-xs px-1.5 py-0.5 rounded bg-gray-900 text-white">{group.airline}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600 text-xs">{group.pnr}</td>
                      <td className="p-3 truncate"><div className="font-bold text-gray-800 text-xs">{group.agencyName}</div></td>
                      <td className="p-3 truncate"><div className="text-[11px] font-medium text-gray-600">{group.agentName}</div></td>
                      <td className="p-3 text-center bg-blue-50/10"><div className="text-xs font-semibold text-gray-900">{formatDate(group.depDate)}</div></td>
                      <td className="p-3 text-center"><div className="text-xs font-semibold text-gray-400">{group.retDate ? formatDate(group.retDate) : '-'}</div></td>
                      <td className="p-3 text-center"><div className="text-[10px] font-medium text-gray-500">{group.recordByAgent ? formatDate(group.recordByAgent) : '-'}</div></td>
                      <td className="p-3 text-center"><div className="text-[10px] font-medium text-gray-500">{group.dateSentToAirline ? formatDate(group.dateSentToAirline) : '-'}</div></td>
                      <td className="p-3"><div className="text-[11px] font-medium text-gray-500 truncate">{group.routing}</div></td>
                      <td className="p-3 text-center">
                        <div className="text-xs font-bold text-gray-600">
                          {group.originalSize && group.originalSize !== group.size ? (
                            <span title="Original / Current" className="flex items-center justify-center gap-1">
                              <span className="text-gray-400 line-through text-[10px] decoration-red-300 decoration-2">{group.originalSize}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-blue-600 text-sm">{group.size}</span>
                            </span>
                          ) : (
                            group.size
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center"><div className="text-[10px] font-medium text-gray-500">{group.depositDate ? formatDate(group.depositDate) : '-'}</div></td>
                      <td className="p-3 text-center"><div className="text-[10px] font-medium text-gray-500">{group.fullPaymentDate ? formatDate(group.fullPaymentDate) : '-'}</div></td>
                      <td className="p-3 text-center"><div className="text-[10px] font-medium text-gray-500">{group.namesDate ? formatDate(group.namesDate) : '-'}</div></td>
                      <td className="p-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(group.status)}`}>{group.status}</span></td>
                      <td className="p-3 text-right"><div className="font-medium text-gray-700 text-xs">{symbol}{fare.toLocaleString()}</div></td>
                      <td className="p-3 text-right"><div className="font-medium text-gray-500 text-xs">{symbol}{tax.toLocaleString()}</div></td>
                      <td className="p-3 text-right"><div className="font-medium text-indigo-500 text-xs">{symbol}{markup.toLocaleString()}</div></td>
                      <td className="p-3 text-right border-l border-gray-50 bg-gray-50/30">
                        <div className="font-black text-blue-700 text-xs">{symbol}{totalPP.toLocaleString()}</div>
                      </td>
                      <td className="p-3"><div className="text-[10px] text-gray-500 truncate italic" title={group.remarks}>{group.remarks || '-'}</div></td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          {isConfirming ? (
                            <div className="flex items-center gap-1 bg-red-50 rounded-lg p-0.5 border border-red-100 animate-in fade-in zoom-in duration-200">
                              <button onClick={() => onDelete(group.id)} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded transition-all flex items-center gap-1 text-[10px] font-black"><Check className="w-3.5 h-3.5" /> Confirm</button>
                              <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 text-gray-400 hover:bg-gray-200 rounded transition-all"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <>
                              {canEdit ? (
                                <button
                                  onClick={() => onEdit(group)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-black text-[10px] transition-all shadow-sm border border-blue-100"
                                  title="Edit Group"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>EDIT</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-300 rounded-xl font-black text-[10px] border border-gray-100 cursor-not-allowed">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>LOCKED</span>
                                </div>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => setConfirmDeleteId(group.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status: PNRStatus) => {
  if (status.startsWith('PD')) return 'bg-amber-50 text-amber-700 border border-amber-100';
  if (status.startsWith('OK')) return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  if (status.startsWith('XX')) return 'bg-rose-50 text-rose-700 border border-rose-100';
  return 'bg-blue-50 text-blue-700 border border-blue-100';
};
