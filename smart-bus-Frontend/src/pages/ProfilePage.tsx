import React, { useEffect, useState } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

const ProfilePage = () => {
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

    // Display preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Backend implementation for actual upload would go here.
    // const formData = new FormData(); formData.append('image', file);
    // await Api.post('/users/profile-picture', formData);
  };

  if (loading) return <div className="p-8 text-center text-app-mu">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-app-err">Failed to load profile</div>;

  return (
    <div className="mx-auto max-w-2xl p-6 pb-20 font-sans animate-in fade-in zoom-in-95 duration-300">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-app-tx">My Profile</h1>
        <p className="text-xs text-app-mu">View your student data and update profile picture</p>
      </header>

      <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full border-4 border-app-bd bg-app-card2 overflow-hidden flex items-center justify-center text-app-mu text-3xl font-black">
              {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover" /> : profile.name?.charAt(0)}
            </div>
            <label className="absolute bottom-0 right-0 bg-app-am text-black p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg">
              <Ic.User size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-xl font-black text-app-tx">{profile.name}</h2>
            <p className="text-xs font-bold text-app-mu uppercase tracking-widest">{profile.student_id || "Student"}</p>
            <span className="inline-block px-3 py-1 bg-app-am/10 text-app-am text-[10px] font-black uppercase tracking-widest rounded-md mt-2">
              {profile.role}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm space-y-4">
        <h4 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-app-tx">
          <Ic.Pin className="text-app-am" size={16} /> Account Details
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-app-card2 border border-app-bd/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-mu mb-1">Email</p>
            <p className="text-sm font-bold text-app-tx break-all">{profile.email}</p>
          </div>
          <div className="p-4 rounded-xl bg-app-card2 border border-app-bd/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-mu mb-1">Phone</p>
            <p className="text-sm font-bold text-app-tx">{profile.phone || "Not provided"}</p>
          </div>
          <div className="p-4 rounded-xl bg-app-card2 border border-app-bd/50 md:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-mu mb-1">Joined</p>
            <p className="text-sm font-bold text-app-tx">{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;