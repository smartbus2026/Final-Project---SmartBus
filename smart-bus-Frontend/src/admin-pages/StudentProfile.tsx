import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ic } from '../icons';
import Api from '../services/Api';

interface BookingRecord {
  _id: string;
  date: string;
  timeSlot: string;
  specificReturnTime?: string;
  attendanceStatus: string;
  route?: { name: string };
}

interface StudentData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

interface Stats {
  completed: number;
  missed: number;
  total: number;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  completed: { label: 'Present',  class: 'bg-green-500/10 text-app-ok border border-green-500/20'   },
  missed:    { label: 'Missed',   class: 'bg-red-500/10 text-app-err border border-red-500/20'      },
  assigned:  { label: 'Assigned', class: 'bg-app-am/10 text-app-am border border-app-am/20'          },
  pending:   { label: 'Pending',  class: 'bg-app-bd text-app-mu border border-app-bd'               },
};

const StudentProfile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ completed: 0, missed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Client-side filter
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        const res = await Api.get(`/users/${studentId}/attendance-history`);
        const { student: s, bookings: b, stats: st } = res.data.data;
        setStudent(s);
        setBookings(b || []);
        setStats(st || { completed: 0, missed: 0, total: 0 });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load student profile.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [studentId]);

  const filteredBookings = filterStatus
    ? bookings.filter(b => b.attendanceStatus === filterStatus)
    : bookings;

  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex-1 bg-app-bg p-8 flex flex-col items-center justify-center gap-4 min-h-screen">
        <div className="w-10 h-10 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">Loading Student...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex-1 bg-app-bg p-8 flex flex-col items-center justify-center gap-4 min-h-screen">
        <Ic.Users size={48} className="opacity-20 text-app-mu" />
        <p className="text-app-err font-black uppercase text-[11px] tracking-widest">{error || 'Student not found.'}</p>
        <button onClick={() => navigate(-1)} className="text-[10px] font-black uppercase tracking-widest text-app-am hover:underline">
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen">

      {/* ── Back navigation ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-mu hover:text-app-tx transition-colors mb-6"
      >
        ← Back to Students
      </button>

      {/* ── Student Profile Header ── */}
      <div className="bg-app-card border border-app-bd rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-app-am/10 flex items-center justify-center text-app-am text-3xl font-black shrink-0">
          {student.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">{student.name}</h1>
          <p className="text-[11px] text-app-mu mt-1">{student.email}</p>
          {student.phone && <p className="text-[11px] text-app-mu">{student.phone}</p>}
          {student.createdAt && (
            <p className="text-[9px] font-bold text-app-mu mt-2 uppercase tracking-widest">
              Joined {new Date(student.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate(`/admin/users/${studentId}/settings`)}
          className="px-4 py-2 rounded-xl border border-app-bd text-[10px] font-black uppercase tracking-widest text-app-mu hover:border-app-am hover:text-app-tx transition-all self-start sm:self-auto"
        >
          Edit Profile
        </button>
      </div>

      {/* ── Statistics Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Recorded', value: stats.total, color: 'text-app-mu' },
          { label: 'Completed',      value: stats.completed, color: 'text-app-ok' },
          { label: 'Missed',         value: stats.missed,    color: 'text-app-err' },
          { label: 'Attend Rate',    value: `${rate}%`,      color: rate >= 75 ? 'text-app-ok' : 'text-app-err' },
        ].map(s => (
          <div key={s.label} className="bg-app-card border border-app-bd rounded-2xl p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-app-mu mb-2">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Attendance Rate Bar ── */}
      <div className="bg-app-card border border-app-bd rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-app-mu">Attendance Rate</span>
          <span className={`font-black text-xl ${rate >= 75 ? 'text-app-ok' : 'text-app-err'}`}>{rate}%</span>
        </div>
        <div className="w-full bg-app-card2 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${rate >= 75 ? 'bg-app-ok' : 'bg-app-err'}`}
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className="mt-2 text-[9px] font-bold text-app-mu uppercase tracking-widest">
          {rate >= 75 ? '✓ Good attendance' : '⚠ Below 75% threshold'}
        </p>
      </div>

      {/* ── Attendance History Table ── */}
      <div className="bg-app-card border border-app-bd rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-app-bd gap-3">
          <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest">Attendance History</h3>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-app-bg text-app-tx text-[10px] font-bold uppercase tracking-widest border border-app-bd rounded-xl px-3 py-2 focus:outline-none focus:border-app-am transition-colors"
          >
            <option value="">All Records</option>
            <option value="completed">Completed Only</option>
            <option value="missed">Missed Only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-bd bg-app-bg/50">
                {['Date', 'Route', 'Time Slot', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-app-mu uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-bd">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-app-mu">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const cfg = statusConfig[b.attendanceStatus] || statusConfig.pending;
                  return (
                    <tr key={b._id} className="hover:bg-app-card2/40 transition-colors">
                      <td className="px-6 py-4 text-[12px] font-bold text-app-tx whitespace-nowrap">
                        {new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-[12px] font-medium text-app-tx">
                          <span className="text-app-am"><Ic.Pin size={13} /></span>
                          {b.route?.name || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[12px] text-app-mu">
                          <Ic.Clock size={12} />
                          {b.timeSlot}
                          {b.specificReturnTime ? ` (${b.specificReturnTime})` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.class}`}>
                          {cfg.label}
                        </span>
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

export default StudentProfile;
