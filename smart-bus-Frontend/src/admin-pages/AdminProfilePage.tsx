import React, { useEffect, useState } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

const AdminProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    Api.get('/users/profile')
      .then(res => {
        setProfile(res.data);
        setPreview(res.data.profilePicture || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  if (loading) return <div className="p-8 text-center text-app-mu font-black uppercase tracking-widest text-[11px]">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-app-err font-black uppercase tracking-widest text-[11px]">Failed to load profile</div>;

  return (
    <div className="p-8 space-y-8 bg-app-bg text-app-tx min-h-screen transition-colors duration-500 animate-in fade-in zoom-in-95">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-app-tx">Admin Profile</h2>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">Manage Your Administrator Account</p>
        </div>
      </div>

      <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm max-w-3xl">
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="relative group">
            <div className="h-28 w-28 rounded-[2rem] border-4 border-app-bd bg-app-card2 overflow-hidden flex items-center justify-center text-app-mu text-4xl font-black">
              {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover" /> : profile.name?.charAt(0)}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-app-am text-black p-3 rounded-xl cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-app-am/30">
              <Ic.User size={18} />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl font-black text-app-tx uppercase tracking-wider">{profile.name}</h2>
            <p className="text-[11px] font-bold text-app-mu uppercase tracking-[0.2em]">{profile.email}</p>
            <span className="inline-block px-4 py-1.5 bg-app-am/10 text-app-am text-[10px] font-black uppercase tracking-widest rounded-xl mt-2 border border-app-am/20">
              System Administrator
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-app-bd/50">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-mu">Admin ID</p>
            <div className="bg-app-card2 px-4 py-3 rounded-2xl border border-app-bd/30 font-bold text-[13px]">
              {profile._id?.slice(-6).toUpperCase() || "ADM-001"}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-mu">Contact Number</p>
            <div className="bg-app-card2 px-4 py-3 rounded-2xl border border-app-bd/30 font-bold text-[13px]">
              {profile.phone || "Not Configured"}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-mu">Account Created</p>
            <div className="bg-app-card2 px-4 py-3 rounded-2xl border border-app-bd/30 font-bold text-[13px]">
              {new Date(profile.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
