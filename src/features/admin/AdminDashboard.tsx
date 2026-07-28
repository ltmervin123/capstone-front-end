import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  History, 
  UserCheck, 
  UserX,
  Trash2,
  Plus,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Settings,
  Activity
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { type User, Role } from '../../types/types';
import { motion } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [activeTab, setActiveTab] = useState<'registry' | 'approvals' | 'logs'>('registry');
  
  // Registry Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | Role>('All');
  
  // Log Search
  const [logSearchQuery, setLogSearchQuery] = useState('');
  
  // Custom user input form state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    email: '', 
    password: '',
    isAdmin: false,
    permissions: {
      dashboard: true,
      employees: true,
      attendance: true,
      payroll: false,
      leaves: true,
      talentAcquisition: true,
      aiSearch: false,
      reports: false,
    }
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<{
    dashboard: boolean;
    employees: boolean;
    attendance: boolean;
    payroll: boolean;
    leaves: boolean;
    talentAcquisition: boolean;
    aiSearch: boolean;
    reports: boolean;
  } | null>(null);

  const logs = storageService.getLogs();

  // Filter approved vs pending
  const approvedUsers = useMemo(() => {
    return users.filter(u => u.isApproved);
  }, [users]);

  const pendingUsers = useMemo(() => {
    return users.filter(u => !u.isApproved);
  }, [users]);

  // Filter approved users list based on search/filter state
  const filteredApprovedUsers = useMemo(() => {
    return approvedUsers.filter(u => {
      const matchSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = filterRole === 'All' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [approvedUsers, searchQuery, filterRole]);

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      return l.username.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
             l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
             l.details.toLowerCase().includes(logSearchQuery.toLowerCase());
    });
  }, [logs, logSearchQuery]);

  // Actions
  const handleToggleStatus = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) return { ...u, isActive: !u.isActive };
      return u;
    });
    setUsers(updated);
    const u = updated.find(x => x.id === userId);
    if (u) {
      storageService.saveUser(u);
      storageService.addLog('Admin', `${u.isActive ? 'Activated' : 'Disabled'} user: ${u.username}`);
    }
  };

  const handleApprove = (userId: string) => {
    const defaultHRAuth = {
      dashboard: true,
      employees: true,
      attendance: true,
      payroll: false,
      leaves: true,
      talentAcquisition: true,
      aiSearch: false,
      reports: false,
    };
    const updated = users.map(u => {
      if (u.id === userId) return { ...u, isApproved: true, permissions: u.permissions || defaultHRAuth };
      return u;
    });
    setUsers(updated);
    const u = updated.find(x => x.id === userId);
    if (u) {
      storageService.saveUser(u);
      storageService.addLog('Admin', `Approved user register request: ${u.username}`);
    }
  };

  const handleDecline = (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (u) {
      const updated = users.filter(x => x.id !== userId);
      setUsers(updated);
      localStorage.setItem('normi_hr_users', JSON.stringify(updated));
      storageService.addLog('Admin', `Declined and deleted registration: ${u.username}`);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (u) {
      if (u.id === 'admin-1') {
        alert('Cannot delete primary administrator.');
        return;
      }
      const updated = users.filter(x => x.id !== userId);
      setUsers(updated);
      localStorage.setItem('normi_hr_users', JSON.stringify(updated));
      storageService.addLog('Admin', `Deleted user account: ${u.username}`);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
       alert('Username already exists!');
       return;
    }
    
    // Passwords limitation validation
    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long for system security limits.');
      return;
    }

    const newUserRecord: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      role: newUser.isAdmin ? Role.ADMIN : Role.HR,
      isActive: true,
      isApproved: true,
      createdAt: Date.now(),
      permissions: newUser.isAdmin ? {
        dashboard: true,
        employees: true,
        attendance: true,
        payroll: true,
        leaves: true,
        talentAcquisition: true,
        aiSearch: true,
        reports: true,
      } : newUser.permissions
    };
    const updated = [...users, newUserRecord];
    setUsers(updated);
    localStorage.setItem('normi_hr_users', JSON.stringify(updated));
    storageService.addLog('Admin', `Created new user: ${newUserRecord.username}`, `Admin: ${newUserRecord.role === Role.ADMIN}`);
    setNewUser({ 
      username: '', 
      email: '', 
      password: '',
      isAdmin: false,
      permissions: {
        dashboard: true,
        employees: true,
        attendance: true,
        payroll: false,
        leaves: true,
        talentAcquisition: true,
        aiSearch: false,
        reports: false,
      }
    });
    setIsAddingUser(false);
  };

  const handleInlinePermissionChange = (field: keyof typeof newUser.permissions, val: boolean) => {
    if (editingUserId && editingPermissions) {
      setEditingPermissions({
        ...editingPermissions,
        [field]: val
      });
    } else {
      setNewUser({
        ...newUser,
        permissions: {
          ...newUser.permissions,
          [field]: val
        }
      });
    }
  };

  const handleSaveInlinePermissions = (userId: string) => {
    if (!editingPermissions) return;
    const updated = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          permissions: editingPermissions
        };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('normi_hr_users', JSON.stringify(updated));
    const target = updated.find(x => x.id === userId);
    if (target) {
      storageService.saveUser(target);
      storageService.addLog('Admin', `Updated access rule limits for: ${target.username}`);
    }
    setEditingUserId(null);
    setEditingPermissions(null);
  };

  const stats = [
    { label: 'Personnel Users', value: approvedUsers.length, icon: Users, color: 'text-green-950', bg: 'bg-green-100/50' },
    { label: 'Pending Approvals', value: pendingUsers.length, icon: ShieldCheck, color: 'text-yellow-700', bg: 'bg-yellow-105/90', isWarning: pendingUsers.length > 0 },
    { label: 'Audit Logs', value: logs.length, icon: History, color: 'text-blue-900', bg: 'bg-blue-50/70' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src="https://normi.edu.ph/wp-content/uploads/2021/04/NMC-Logo.png" 
            alt="NMC Logo" 
            className="w-12 h-12 object-contain"
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">Administration</h1>
              <div className="p-1 px-2 border border-green-900 rounded-lg flex items-center gap-1">
                <ShieldCheck className="text-green-900" size={14} />
                <span className="text-[10px] font-black text-green-900 uppercase">Secure</span>
              </div>
            </div>
            <p className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">NMC-HR Control Board</p>
          </div>
        </div>
        
        {activeTab === 'registry' && (
          <button 
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="flex items-center gap-2 px-6 py-3 bg-green-900 text-yellow-400 font-black rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            {isAddingUser ? <X size={18} /> : <Plus size={18} />}
            {isAddingUser ? 'Close Form' : 'Add System User'}
          </button>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-green-950">{stat.value}</h3>
            </div>
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} ${stat.isWarning ? 'animate-pulse border border-yellow-200' : ''}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Sub-header Tab Bar */}
      <div className="flex border-b border-gray-100 gap-6 mt-4">
        <button 
          onClick={() => setActiveTab('registry')}
          className={`pb-3 text-sm font-black uppercase tracking-tight transition-all relative cursor-pointer ${
            activeTab === 'registry' ? 'text-green-950 font-black' : 'text-gray-400 hover:text-green-800'
          }`}
        >
          User Registry ({approvedUsers.length})
          {activeTab === 'registry' && (
            <motion.div layoutId="adminActiveTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 text-sm font-black uppercase tracking-tight transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'approvals' ? 'text-green-950 font-black' : 'text-gray-400 hover:text-green-800'
          }`}
        >
          Account Approvals
          {pendingUsers.length > 0 ? (
            <span className="px-2.5 py-0.5 bg-yellow-400 text-green-950 text-[10px] font-black rounded-full animate-bounce">
              {pendingUsers.length}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">({pendingUsers.length})</span>
          )}
          {activeTab === 'approvals' && (
            <motion.div layoutId="adminActiveTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-black uppercase tracking-tight transition-all relative cursor-pointer ${
            activeTab === 'logs' ? 'text-green-950 font-black' : 'text-gray-400 hover:text-green-800'
          }`}
        >
          System Logs ({logs.length})
          {activeTab === 'logs' && (
            <motion.div layoutId="adminActiveTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
          )}
        </button>
      </div>

      {/* Registry Tab Content */}
      {activeTab === 'registry' && (
        <div className="space-y-6">
          {/* Add User Panel */}
          {isAddingUser && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-yellow-50 p-8 rounded-[35px] border border-yellow-250 shadow-inner space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-yellow-200/50 pb-4">
                <span className="text-lg">👤</span>
                <h3 className="font-black text-green-950 uppercase text-sm tracking-tight">System User Onboarding</h3>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2">Username</label>
                    <input 
                      type="text" required 
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-yellow-250 rounded-xl outline-none focus:ring-2 focus:ring-green-900 font-bold" 
                      placeholder="john_doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2">Work Email</label>
                    <input 
                      type="email" required 
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-yellow-250 rounded-xl outline-none focus:ring-2 focus:ring-green-900 font-bold" 
                      placeholder="john@normi.edu.ph"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2">Password (Min 6 chars)</label>
                    <input 
                      type="password" required 
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-yellow-250 rounded-xl outline-none focus:ring-2 focus:ring-green-900 font-bold" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2">Account Type</label>
                    <div className="flex items-center gap-3 bg-white px-4 py-3 border border-yellow-250 rounded-xl min-h-[48px]">
                      <input 
                        type="checkbox" 
                        id="isAdminCheck"
                        checked={newUser.isAdmin}
                        onChange={e => setNewUser({...newUser, isAdmin: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-green-900 focus:ring-green-900 cursor-pointer"
                      />
                      <label htmlFor="isAdminCheck" className="text-xs font-black text-green-900 cursor-pointer uppercase select-none">
                        Admin Privileges
                      </label>
                    </div>
                  </div>
                </div>

                {/* Permissions Segment */}
                <div className="bg-white/80 p-6 rounded-2xl border border-yellow-200/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-green-950 uppercase tracking-tight">Access Rule Limitations</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Determine exactly which modules this user can view</p>
                    </div>
                    {newUser.isAdmin && (
                      <span className="px-2.5 py-0.5 bg-green-900 text-yellow-400 text-[9px] font-black rounded-full uppercase tracking-widest animate-pulse">
                        All Rules Granted
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { key: 'dashboard', label: 'Dashboard Hub' },
                      { key: 'employees', label: 'Employee Manager' },
                      { key: 'attendance', label: 'Attendance & Time' },
                      { key: 'payroll', label: 'Payroll & Allowances' },
                      { key: 'leaves', label: 'Leave Records' },
                      { key: 'talentAcquisition', label: 'Talent Acquisition' },
                      { key: 'aiSearch', label: 'AI Semantic Search' },
                      { key: 'reports', label: 'Reports Hub' },
                    ].map((item) => {
                      const isAllowed = newUser.isAdmin ? true : newUser.permissions[item.key as keyof typeof newUser.permissions];
                      return (
                        <label 
                          key={item.key} 
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isAllowed 
                              ? 'bg-green-50/50 border-green-200 text-green-900 font-bold' 
                              : 'bg-white border-gray-200/60 hover:border-gray-300 text-gray-400 font-bold'
                          } ${newUser.isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <input 
                            type="checkbox"
                            checked={isAllowed}
                            disabled={newUser.isAdmin}
                            onChange={(e) => handleInlinePermissionChange(item.key as any, e.target.checked)}
                            className="w-4 h-4 rounded text-green-900 border-gray-300 focus:ring-green-900 accent-green-900 cursor-pointer"
                          />
                          <span className="text-[11px] uppercase tracking-tight font-black">{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setIsAddingUser(false)} className="px-6 py-3 bg-white text-green-950 border border-yellow-250 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-gray-50 active:scale-95 transition-all cursor-pointer">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-green-900 text-yellow-400 font-black rounded-xl uppercase text-xs tracking-wider hover:bg-green-950 active:scale-95 transition-all cursor-pointer shadow-md">Add Account</button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Filters & Search */}
          <div className="bg-white p-5 rounded-[40px] border border-gray-100 shadow-xl flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search staff user accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-955"
              />
            </div>
            <div className="flex items-center gap-3 min-w-[250px]">
              <Filter className="text-green-800" size={18} />
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="flex-1 bg-gray-50 border-none rounded-[24px] py-4 px-6 outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-900 cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value={Role.ADMIN}>Administrators Only</option>
                <option value={Role.HR}>HR Staff Only</option>
              </select>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-green-900 text-yellow-400">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">User Profile</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Permissions</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Account Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Commands</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredApprovedUsers.map(u => {
                    const isEditing = editingUserId === u.id;
                    return (
                      <React.Fragment key={u.id}>
                        <tr className="hover:bg-yellow-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-inner ${u.role === Role.ADMIN ? 'bg-green-100 text-green-900' : 'bg-yellow-105 text-yellow-900 border border-yellow-200'}`}>
                                {u.username[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-green-950 leading-none">{u.username}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-wider">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {u.role === Role.ADMIN ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black text-green-800 uppercase tracking-wider bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                  Full Master Access
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap gap-1 max-w-sm">
                                  {!u.permissions || Object.entries(u.permissions).filter(([_, v]) => v).length === 0 ? (
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                      No Modules Permitted
                                    </span>
                                  ) : (
                                    Object.entries(u.permissions)
                                      .filter(([_, v]) => v)
                                      .map(([k]) => {
                                        const mapping: { [key: string]: string } = {
                                          dashboard: 'Dashboard',
                                          employees: 'Employees',
                                          attendance: 'Attendance',
                                          payroll: 'Payroll',
                                          leaves: 'Leaves',
                                          talentAcquisition: 'Talent Acquisition',
                                          aiSearch: 'AI Search',
                                          reports: 'Reports',
                                        };
                                        return (
                                          <span key={k} className="text-[9px] font-black text-green-750 tracking-tight bg-green-50/70 px-2.5 py-0.5 rounded border border-green-100">
                                            {mapping[k] || k}
                                          </span>
                                        );
                                      })
                                  )}
                                </div>
                                {u.id !== 'admin-1' && (
                                  <button
                                    onClick={() => {
                                      setEditingUserId(u.id);
                                      setEditingPermissions(u.permissions || {
                                        dashboard: true,
                                        employees: true,
                                        attendance: true,
                                        payroll: false,
                                        leaves: true,
                                        talentAcquisition: true,
                                        aiSearch: false,
                                        reports: false,
                                      });
                                    }}
                                    className="text-[10px] text-green-900 font-extrabold uppercase tracking-tight hover:underline flex items-center gap-1 self-start transition-all"
                                  >
                                    ⚙️ Adjust Access Rules
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${u.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.45)]' : 'bg-red-400'}`} />
                              <span className={`text-[11px] font-black uppercase tracking-tight ${u.isActive ? 'text-green-700' : 'text-red-500'}`}>
                                {u.isActive ? 'Active Access' : 'Suspended'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => handleToggleStatus(u.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${
                                  u.isActive ? 'bg-red-50 text-red-650 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                              >
                                {u.isActive ? 'Suspend' : 'Activate'}
                              </button>
                              
                              {u.id !== 'admin-1' && (
                                <button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                  title="Delete Account"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isEditing && (
                          <tr className="bg-yellow-50/20">
                            <td colSpan={4} className="px-8 py-6 border-t border-b border-yellow-200/40">
                              <div className="space-y-4 max-w-4xl pt-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-xs font-black text-green-950 uppercase tracking-tight">Configure Rule Limitations for @{u.username}</h5>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Select the permitted sections for this staff account</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        setEditingUserId(null);
                                        setEditingPermissions(null);
                                      }}
                                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-50 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={() => handleSaveInlinePermissions(u.id)}
                                      className="px-4 py-1.5 bg-green-900 text-yellow-400 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-green-850 cursor-pointer shadow-sm"
                                    >
                                      Apply Changes
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-yellow-100">
                                  {[
                                    { key: 'dashboard', label: 'Dashboard Hub' },
                                    { key: 'employees', label: 'Employee Manager' },
                                    { key: 'attendance', label: 'Attendance & Time' },
                                    { key: 'payroll', label: 'Payroll & Allowances' },
                                    { key: 'leaves', label: 'Leave Records' },
                                    { key: 'talentAcquisition', label: 'Talent Acquisition' },
                                    { key: 'aiSearch', label: 'AI Semantic Search' },
                                    { key: 'reports', label: 'Reports Hub' },
                                  ].map((item) => (
                                    <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-green-200 cursor-pointer text-[11px] font-black uppercase select-none text-green-900 bg-gray-50/50">
                                      <input 
                                        type="checkbox"
                                        checked={editingPermissions?.[item.key as keyof typeof editingPermissions] || false}
                                        onChange={(e) => handleInlinePermissionChange(item.key as any, e.target.checked)}
                                        className="w-3.5 h-3.5 rounded text-green-900 border-gray-300 focus:ring-green-900 cursor-pointer"
                                      />
                                      {item.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredApprovedUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-35">
                          <Search size={48} className="text-green-900 animate-bounce" />
                          <p className="font-black uppercase text-xs tracking-[0.2em] text-green-950">No administrative accounts match your search</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Account Approvals Tab Content */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-green-900 text-yellow-400">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Requested Account</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Requested Role</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Submission Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingUsers.map(u => (
                    <tr key={u.id} className="hover:bg-yellow-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-yellow-105 border border-yellow-250 text-yellow-750 flex items-center justify-center font-black shadow-inner">
                            {u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-green-950 leading-none">{u.username}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-wider">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.05em] bg-yellow-100 text-yellow-800">
                          {u.role === Role.ADMIN ? 'Administrator' : 'HR Staff'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                          <span className="text-[10px] font-black bg-yellow-50 text-yellow-800 px-2.5 py-1 rounded-full uppercase tracking-widest border border-yellow-100">
                            Awaiting Approval
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleApprove(u.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-950 text-yellow-400 font-bold rounded-xl text-xs uppercase cursor-pointer shadow-md transition-all active:scale-95"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          
                          <button 
                            onClick={() => handleDecline(u.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold rounded-xl text-xs uppercase cursor-pointer border border-red-100 transition-all active:scale-95"
                          >
                            <X size={14} />
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 py-8">
                          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                            <ShieldCheck size={36} />
                          </div>
                          <div>
                            <p className="font-black uppercase text-sm tracking-[0.2em] text-green-950">ALL ACCOUNTS COMPLETED</p>
                            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-tight">There are no pending registrations waiting for authorization at this time.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab Content */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-5 rounded-[40px] border border-gray-100 shadow-xl flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search audit trail logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-955"
              />
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-green-900 text-yellow-400">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Timestamp</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Operator</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Event Action / Payload</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">System Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-yellow-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="font-mono text-xs font-black text-green-900">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 text-green-900 flex items-center justify-center font-bold text-xs shadow-inner">
                            {log.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-green-950">{log.username}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="font-black text-xs text-green-900 uppercase tracking-tight">{log.action}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 leading-normal max-w-lg">{log.details || 'General operation log.'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                          <Activity size={10} className="animate-pulse text-green-600" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <History size={48} className="text-green-900" />
                          <p className="font-black uppercase text-xs tracking-[0.3em] text-green-950">No Log Entries Found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
