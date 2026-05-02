import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupSchemaType } from '../schemas/authSchema';
import { User, Phone, Hash, ShieldCheck, Lock, Eye, EyeOff, Loader2, Plus } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  student_id?: string;
  phone_number?: string;
  createdAt: string;
}

// ─── Input Group Component (copied from SignUp) ───────────────────────────────
const InputGroup: React.FC<{
  label: string;
  placeholder: string;
  type?: string;
  inputProps: any;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = ({ label, placeholder, type = 'text', inputProps, error, icon, disabled }) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-black text-app-mu uppercase ml-1 tracking-wider">{label}</label>
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-4 text-app-mu group-focus-within:text-app-am transition-colors">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        {...inputProps}
        disabled={disabled}
        className={`w-full bg-app-bg border border-app-bd py-3.5 ${icon ? 'pl-12' : 'px-4'} pr-4 rounded-xl text-app-tx outline-none focus:border-app-am transition-all text-sm placeholder:text-app-mu2 disabled:opacity-50 font-bold`}
      />
    </div>
    {error && <p className="text-app-err text-[10px] mt-1 ml-1 font-medium">{error}</p>}
  </div>
);

// ─── Add User Modal ───────────────────────────────────────────────────────────
const AddUserModal: React.FC<{ onClose: () => void; onSuccess: () => void; setToast: (t: any) => void }> = ({
  onClose,
  onSuccess,
  setToast,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'student' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupSchemaType) => {
    setLoading(true);
    setServerError(null);
    try {
      await Api.post('/auth/register', {
        name: data.fullName,
        email: data.email,
        password: data.password,
        student_id: data.student_id,
        role: data.role,
        phone_number: data.phone_number,
      });
      setToast({ msg: '✅ User added successfully', type: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      setServerError(error.response?.data?.message || error.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3500] flex items-center justify-center p-6 backdrop-blur-xl">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/60" onClick={onClose} />
      <div className="bg-app-card border border-app-bd w-full max-w-md rounded-[3rem] relative z-10 p-10 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh]">

        <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 italic">
          Add <span className="text-app-am">User</span>
        </h2>

        {serverError && (
          <div className="mb-6 p-4 bg-app-err/10 border border-app-err/20 text-app-err text-xs rounded-xl text-center font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-app-bg rounded-2xl border border-app-bd mb-4">
            {['student', 'admin'].map((role) => (
              <label
                key={role}
                className={`flex items-center justify-center py-2.5 rounded-xl cursor-pointer transition-all text-[11px] font-black uppercase tracking-wider
                  ${selectedRole === role ? 'bg-app-am text-white dark:text-black shadow-lg' : 'text-app-mu hover:text-app-tx'}`}
              >
                <input type="radio" {...register('role')} value={role} className="hidden" />
                {role}
              </label>
            ))}
          </div>

          <InputGroup
            label="Full Name"
            icon={<User size={18} />}
            error={errors.fullName?.message}
            inputProps={register('fullName')}
            placeholder="e.g. Ahmed Mohamed"
            disabled={loading}
          />

          <InputGroup
            label="Institutional Email"
            icon={<ShieldCheck size={18} />}
            error={errors.email?.message}
            inputProps={register('email')}
            placeholder="name@university.edu"
            disabled={loading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup
              label="Phone Number"
              icon={<Phone size={18} />}
              error={errors.phone_number?.message}
              inputProps={register('phone_number')}
              placeholder="01xxxxxxxxx"
              disabled={loading}
            />
            {selectedRole === 'student' && (
              <InputGroup
                label="Student ID"
                icon={<Hash size={18} />}
                error={errors.student_id?.message}
                inputProps={register('student_id')}
                placeholder="ID Number"
                disabled={loading}
              />
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5 group">
            <label className="text-[10px] font-black text-app-mu uppercase ml-1 tracking-wider">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-app-mu group-focus-within:text-app-am transition-colors" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                disabled={loading}
                className="w-full bg-app-bg border border-app-bd py-3.5 pl-12 pr-12 rounded-xl text-app-tx outline-none focus:border-app-am transition-all text-sm placeholder:text-app-mu2 disabled:opacity-50 font-bold"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-app-mu hover:text-app-tx transition-colors">
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-app-err text-[10px] mt-1 ml-1 font-medium">{errors.password.message}</p>}
          </div>

          <InputGroup
            label="Confirm Password"
            type="password"
            icon={<Lock size={18} />}
            error={errors.confirmPassword?.message}
            inputProps={register('confirmPassword')}
            placeholder="••••••••"
            disabled={loading}
          />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-app-bg2 font-black uppercase text-[10px] hover:brightness-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-app-am text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-app-am/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Add User'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// ─── Main UsersPage ───────────────────────────────────────────────────────────
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false); // ← NEW

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await Api.get('/users');
      setUsers(response.data);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await Api.put(`/users/${editingUser._id}`, {
        name: editingUser.name,
        phone_number: editingUser.phone_number,
        role: editingUser.role
      });
      setToast({ msg: '✅ Student data updated', type: 'success' });
      setEditingUser(null);
      fetchUsers();
    } catch (error) { setToast({ msg: '❌ Update failed', type: 'error' }); }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await Api.delete(`/users/${confirmDelete._id}`);
      setUsers(users.filter(u => u._id !== confirmDelete._id));
      setToast({ msg: '🗑️ Student removed from system', type: 'success' });
    } catch (error) { setToast({ msg: '❌ Delete failed', type: 'error' }); }
    finally { setConfirmDelete(null); }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.student_id?.includes(searchQuery)
  );

  return (
    <div className="flex-1 bg-app-bg text-app-tx min-h-screen p-8 font-sans relative transition-colors duration-300">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-10 right-10 z-[5000] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top ${
          toast.type === 'success' ? 'bg-app-ok/20 border-app-ok text-app-ok' : 'bg-app-err/20 border-app-err text-app-err'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-app-card border border-app-bd p-10 rounded-[2.5rem] max-w-sm text-center shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-app-err/10 text-app-err rounded-full flex items-center justify-center mx-auto mb-6">
              <Ic.Close size={32} />
            </div>
            <h2 className="text-xl font-black uppercase mb-2">Delete Student?</h2>
            <p className="text-app-mu text-[10px] mb-8 uppercase font-bold tracking-tight">
              Remove <span className="text-app-tx">{confirmDelete.name}</span>? This action is permanent.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 rounded-2xl bg-app-bg2 font-black uppercase text-[10px] hover:brightness-95 transition-all">Cancel</button>
              <button onClick={executeDelete} className="flex-1 py-4 rounded-2xl bg-app-err text-white font-black uppercase text-[10px]">Delete Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="absolute inset-0 bg-black/20 dark:bg-black/60" onClick={() => setEditingUser(null)} />
          <form onSubmit={handleUpdate} className="bg-app-card border border-app-bd w-full max-w-md rounded-[3rem] relative z-10 p-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 italic">Edit <span className="text-app-am">Student</span></h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-app-mu uppercase ml-1">Student Name</label>
                <input type="text" className="w-full bg-app-bg border border-app-bd p-4 rounded-xl text-xs font-bold outline-none focus:border-app-am text-app-tx" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-app-mu uppercase ml-1">Phone Number</label>
                <input type="text" className="w-full bg-app-bg border border-app-bd p-4 rounded-xl text-xs font-bold outline-none focus:border-app-am text-app-tx" value={editingUser.phone_number} onChange={e => setEditingUser({...editingUser, phone_number: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 opacity-50">
                  <label className="text-[10px] font-black text-app-mu uppercase ml-1">Student ID (Locked)</label>
                  <input type="text" disabled className="w-full bg-app-bg2 border border-transparent p-4 rounded-xl text-xs font-bold cursor-not-allowed text-app-mu" value={editingUser.student_id} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-mu uppercase ml-1">System Role</label>
                  <select className="w-full bg-app-bg border border-app-bd p-4 rounded-xl text-xs font-bold outline-none focus:border-app-am text-app-tx appearance-none" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}>
                    <option value="student">STUDENT</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-app-am text-white dark:text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-10 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-app-am/20">
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSuccess={fetchUsers}
          setToast={setToast}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Student <span className="text-app-am">Directory</span></h1>
          <p className="text-app-mu text-[10px] font-bold uppercase tracking-[0.5em] mt-1 italic">Operational Command Center</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="bg-app-card border border-app-bd px-6 py-4 rounded-2xl flex items-center gap-4 flex-1 md:w-[320px] shadow-sm">
            <Ic.Search className="text-app-mu2" />
            <input
              type="text"
              placeholder="FILTER BY NAME OR ID..."
              className="bg-transparent border-none outline-none text-[10px] font-black w-full uppercase tracking-widest placeholder:text-app-mu2 text-app-tx"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Add User Button */}
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center gap-2 bg-app-am text-white dark:text-black px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-app-am/20 whitespace-nowrap"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-app-card border border-app-bd rounded-[3rem] overflow-hidden shadow-xl dark:shadow-2xl transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-app-bg2 text-app-mu text-[9px] font-black uppercase tracking-[0.2em]">
                <th className="px-10 py-8">Full Identity</th>
                <th className="px-10 py-8">Registration ID</th>
                <th className="px-10 py-8">Contact Info</th>
                <th className="px-10 py-8">Authority</th>
                <th className="px-10 py-8 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-black uppercase tracking-tight">
              {isLoading ? (
                <tr><td colSpan={5} className="p-32 text-center text-app-mu2 italic tracking-[0.5em]">Syncing Database...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-32 text-center text-app-mu2 italic tracking-[0.5em]">No Users Found</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id} className="border-t border-app-bd2 hover:bg-app-am-d transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-app-am-g border border-app-am/20 flex items-center justify-center text-app-am text-sm font-black italic">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="text-app-tx mb-0.5">{user.name}</p>
                        <p className="text-[9px] text-app-mu lowercase font-medium italic">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-app-mu2 font-mono">{user.student_id || '---'}</td>
                  <td className="px-10 py-7 text-app-mu2">{user.phone_number || '---'}</td>
                  <td className="px-10 py-7">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black tracking-widest ${user.role === 'admin' ? 'bg-app-am text-white dark:text-black' : 'bg-app-bg2 text-app-mu'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right space-x-2">
                    <button onClick={() => setEditingUser(user)} className="p-3 bg-app-bg2 text-app-mu rounded-xl hover:bg-app-am hover:text-white dark:hover:text-black transition-all shadow-sm">
                      <Ic.Dots size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(user)} className="p-3 bg-app-err/5 text-app-err/60 rounded-xl hover:bg-app-err hover:text-white transition-all">
                      <Ic.Close size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;