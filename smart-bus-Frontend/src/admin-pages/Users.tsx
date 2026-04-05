import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';


interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Student' | 'Driver';
  status: 'Active' | 'Inactive' | 'Pending';
  joinedDate: string;
  avatarLetter: string;
}

type UserForm = Omit<User, 'id' | 'avatarLetter'>;

const EMPTY_FORM: UserForm = {
  name: '',
  email: '',
  role: 'Student',
  status: 'Pending',
  joinedDate: new Date().toISOString().split('T')[0],
};

const PAGE_SIZE = 5;

// --- User Modal (Add / Edit) ---
interface UserModalProps {
  mode: 'add' | 'edit';
  initial: UserForm;
  onSave: (form: UserForm) => void;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ mode, initial, onSave, onClose }) => {
  const [form, setForm] = useState<UserForm>(initial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = <K extends keyof UserForm>(key: K, val: UserForm[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const valid = form.name.trim() && form.email.trim();

  const labelCls = 'text-app-mu text-[10px] uppercase font-black tracking-[0.2em] ml-1';
  const inputCls =
    'w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 outline-none focus:border-app-am transition-all text-xs font-bold text-app-tx uppercase tracking-widest';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-app-card border border-app-bd w-full max-w-lg rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

        <div className="p-8 border-b border-app-bd flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-app-am/20 p-3 rounded-2xl text-app-am"><Ic.Plus /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">
                {mode === 'add' ? 'New User' : 'Edit User'}
              </h2>
              <p className="text-[10px] text-app-mu font-bold uppercase tracking-widest mt-1">
                {mode === 'add' ? 'Register identity' : 'Update profile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-app-card2 border border-app-bd text-app-mu hover:text-app-tx transition-all"
          >
            <Ic.Close />
          </button>
        </div>

        <div className="p-8 space-y-5">
          <div className="space-y-2">
            <label className={labelCls}>Full Name</label>
            <input
              type="text"
              placeholder="FULL NAME"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Email Address</label>
            <input
              type="email"
              placeholder="USER@EXAMPLE.COM"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={`${inputCls} lowercase`}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className={labelCls}>Role</label>
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value as User['role'])}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="Student">Student</option>
                <option value="Driver">Driver</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as User['status'])}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Registry Date</label>
            <input
              type="date"
              value={form.joinedDate}
              onChange={(e) => set('joinedDate', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="p-8 bg-app-card2 border-t border-app-bd flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-8 py-4 text-app-mu font-black text-[10px] uppercase tracking-widest hover:text-app-tx transition-all"
          >
            Discard
          </button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid}
            className="bg-app-am text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-lg shadow-app-am/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === 'add' ? 'Register User' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Delete Confirm Modal ---
interface DeleteModalProps {
  userName: string;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ userName, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
    <div className="bg-app-card border border-app-bd w-full max-w-sm rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="p-8 border-b border-app-bd flex items-center gap-4">
        <div className="bg-red-500/10 p-3 rounded-2xl text-red-400"><Ic.Close /></div>
        <div>
          <h2 className="text-base font-black uppercase tracking-widest">Remove User</h2>
          <p className="text-[10px] text-app-mu font-bold uppercase tracking-widest mt-1">{userName}</p>
        </div>
      </div>
      <div className="p-8">
        <p className="text-xs text-app-mu font-bold uppercase tracking-wide leading-relaxed">
          This will permanently remove this user from the directory. This action cannot be undone.
        </p>
      </div>
      <div className="p-8 bg-app-card2 border-t border-app-bd flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-8 py-4 text-app-mu font-black text-[10px] uppercase tracking-widest hover:text-app-tx transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all"
        >
          Confirm Remove
        </button>
      </div>
    </div>
  </div>
);

// --- Main Component ---
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    { id: 'U-101', name: 'Ahmad Hassan',  email: 'ahmad@example.com',  role: 'Student', status: 'Active',   joinedDate: '2023-10-12', avatarLetter: 'A' },
    { id: 'U-102', name: 'Omar Khalil',   email: 'omar.k@example.com', role: 'Driver',  status: 'Active',   joinedDate: '2023-09-05', avatarLetter: 'O' },
    { id: 'U-103', name: 'Sara Ali',      email: 'sara@smartbus.com',  role: 'Admin',   status: 'Active',   joinedDate: '2023-01-20', avatarLetter: 'S' },
    { id: 'U-104', name: 'Yusuf Nasser',  email: 'yusuf@example.com',  role: 'Student', status: 'Pending',  joinedDate: '2023-11-01', avatarLetter: 'Y' },
    { id: 'U-105', name: 'Khaled Saeed', email: 'khaled@example.com', role: 'Driver',  status: 'Inactive', joinedDate: '2023-08-15', avatarLetter: 'K' },
  ]);

  const [searchQuery,  setSearchQuery]  = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [currentPage,  setCurrentPage]  = useState(1);

  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (selectedRole === 'All' || u.role === selectedRole)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [searchQuery, selectedRole]);

  const makeId = () => `U-${String(Date.now()).slice(-4)}`;

  const handleAdd = (form: UserForm) => {
    const user: User = {
      ...form,
      id: makeId(),
      avatarLetter: form.name.trim()[0]?.toUpperCase() ?? '?',
    };
    setUsers((p) => [user, ...p]);
    setAddOpen(false);
  };

  const handleEdit = (form: UserForm) => {
    if (!editTarget) return;
    setUsers((p) =>
      p.map((u) =>
        u.id === editTarget.id
          ? { ...u, ...form, avatarLetter: form.name.trim()[0]?.toUpperCase() ?? u.avatarLetter }
          : u
      )
    );
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setUsers((p) => p.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg text-app-tx min-h-screen">

      {/* Modals */}
      {addOpen && (
        <UserModal mode="add" initial={EMPTY_FORM} onSave={handleAdd} onClose={() => setAddOpen(false)} />
      )}
      {editTarget && (
        <UserModal
          mode="edit"
          initial={{ name: editTarget.name, email: editTarget.email, role: editTarget.role, status: editTarget.status, joinedDate: editTarget.joinedDate }}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal userName={deleteTarget.name} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}

      {/* Topbar بدل الهيدر */}
      <div className="px-10 pt-8 pb-4 flex items-center justify-between shrink-0">
        <div className="relative w-full md:w-[450px] group">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-app-mu group-focus-within:text-app-am transition-colors">
            <Ic.Search size={18} />
          </span>
          <input
            type="text"
            placeholder="SEARCH BY IDENTITY OR EMAIL..."
            className="w-full bg-app-card border border-app-bd rounded-[1.5rem] pl-14 pr-12 py-4 text-[11px] font-black tracking-widest outline-none focus:border-app-am transition-all text-app-tx placeholder:opacity-20 uppercase"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-app-mu hover:text-app-tx transition-colors"
            >
              <Ic.Close size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              className="appearance-none bg-app-card border border-app-bd rounded-xl px-6 py-3.5 text-[10px] font-black text-app-mu uppercase tracking-widest outline-none cursor-pointer focus:border-app-am/50 min-w-[160px]"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admins</option>
              <option value="Student">Students</option>
              <option value="Driver">Drivers</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <Ic.ChevronDown size={12} />
            </div>
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="bg-app-am text-black text-[10px] font-black px-8 py-3.5 rounded-2xl uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-xl shadow-app-am/10 flex items-center gap-2"
          >
            <Ic.Plus size={14} /> Add New User
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="p-10 flex-1 overflow-y-auto custom-scrollbar">
        <div className="bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-app-bd text-[10px] font-black text-app-mu uppercase tracking-[0.2em]">
                  <th className="px-8 py-6">Identity Profile</th>
                  <th className="px-8 py-6">Assigned Role</th>
                  <th className="px-8 py-6">Current Status</th>
                  <th className="px-8 py-6">Registry Date</th>
                  <th className="px-8 py-6 text-right">Options</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-[10px] font-black text-app-mu uppercase tracking-widest opacity-40">
                      No users match your filters
                    </td>
                  </tr>
                ) : (
                  paginated.map((user) => (
                    <tr key={user.id} className="border-b border-app-bd/50 hover:bg-app-am/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-app-card2 border border-app-bd flex items-center justify-center text-app-am font-black text-sm group-hover:border-app-am/50 transition-all shadow-inner">
                            {user.avatarLetter}
                          </div>
                          <div>
                            <p className="font-black text-app-tx uppercase tracking-tighter text-[13px]">{user.name}</p>
                            <p className="text-[10px] text-app-mu font-bold tracking-widest lowercase opacity-60">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-app-am opacity-40" />
                          <span className="text-app-tx text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          user.status === 'Active'   ? 'bg-app-ok/10 text-app-ok border-app-ok/20'
                          : user.status === 'Pending' ? 'bg-app-am/10 text-app-am border-app-am/20'
                          : 'bg-app-card2 text-app-mu border-app-bd'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-app-mu text-[10px] font-black uppercase tracking-tighter">{user.joinedDate}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditTarget(user)}
                            className="text-app-mu hover:text-app-am transition-all p-2 rounded-lg hover:bg-app-am/5"
                          >
                            <Ic.Gear size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="text-app-mu hover:text-red-400 transition-all p-2 rounded-lg hover:bg-red-500/5"
                          >
                            <Ic.Close size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-6 bg-app-card2/30 border-t border-app-bd flex justify-between items-center">
            <p className="text-[9px] font-black text-app-mu uppercase tracking-[0.2em]">
              Data Sync: {filtered.length} Nodes Resolved / {users.length} Total
            </p>
            <div className="flex gap-3 items-center">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-5 py-2 rounded-xl border border-app-bd text-[9px] font-black text-app-mu uppercase tracking-widest hover:text-app-tx transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    safePage === i + 1 ? 'bg-app-am text-black' : 'border border-app-bd text-app-mu hover:text-app-tx'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}
              <button
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-5 py-2 rounded-xl border border-app-bd text-[9px] font-black text-app-mu uppercase tracking-widest hover:text-app-tx transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UsersPage;