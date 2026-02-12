
import React from 'react';
import { Reminder } from '../types';
import { formatDate } from '../constants';
import { Bell, AlertTriangle, Mail, Calendar, X } from 'lucide-react';

interface ReminderWidgetProps {
  reminders: Reminder[];
  onOpenEmail: (reminder: Reminder) => void;
  onClose?: () => void;
}

export const ReminderWidget: React.FC<ReminderWidgetProps> = ({ reminders, onOpenEmail, onClose }) => {
  const activeReminders = reminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
        <h3 className="font-black text-xl text-gray-900 flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          Pending Tasks
          <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-black">
            {activeReminders.length}
          </span>
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
            title="Close tasks"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {activeReminders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <h4 className="font-bold text-gray-600">No active tasks</h4>
            <p className="text-xs mt-1">Everything is up to date.</p>
          </div>
        ) : (
          activeReminders.map((reminder, idx) => (
            <div key={idx} className={`bg-white p-4 rounded-2xl shadow-sm border ${reminder.isOverdue ? 'border-red-100 bg-red-50/10' : 'border-gray-100'} hover:shadow-md transition-shadow group relative overflow-hidden`}>
              {reminder.isOverdue && <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500"></div>}
              
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black uppercase tracking-wider ${reminder.isOverdue ? 'text-red-500' : 'text-blue-500'}`}>
                  {reminder.type.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                  <Calendar className="w-3 h-3" />
                  {formatDate(reminder.dueDate)}
                </div>
              </div>

              <h5 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{reminder.description}</h5>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                  <span className="font-black text-gray-900">{reminder.pnr}</span>
                  <span className="text-gray-300">|</span>
                  <span className="truncate max-w-[120px]">{reminder.agency}</span>
                </div>
                <button 
                  onClick={() => onOpenEmail(reminder)}
                  className="p-2 hover:bg-blue-600 hover:text-white bg-blue-50 text-blue-600 rounded-xl transition-all shadow-sm flex items-center gap-2"
                  title="View Template"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Draft</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
