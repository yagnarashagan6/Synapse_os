import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { User, Mail, Shield, MapPin, Link } from 'lucide-react';

const Profile = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6">
        <Card className="flex flex-col items-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 p-1 mb-4">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <User size={40} className="text-slate-400" />
                </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Alex Morgan</h2>
            <p className="text-slate-400 text-sm mb-4">Senior Content Strategist</p>
            <Badge variant="purple" className="mb-6">Pro Member</Badge>
            
            <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Member since</span>
                    <span className="text-slate-300">Jan 2024</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Projects</span>
                    <span className="text-slate-300">12 Active</span>
                </div>
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Organizations</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                        S
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-200">Synapse Corp</h4>
                        <p className="text-xs text-slate-500">Admin</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                        E
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-200">EcoTech Ltd</h4>
                        <p className="text-xs text-slate-500">Editor</p>
                    </div>
                </div>
            </div>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Full Name</label>
                    <Input defaultValue="Alex Morgan" icon={User} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Email Address</label>
                    <Input defaultValue="alex.morgan@synapse.ai" icon={Mail} />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Role</label>
                    <Input defaultValue="Senior Strategist" icon={Shield} readOnly className="opacity-50 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Location</label>
                    <Input defaultValue="San Francisco, CA" icon={MapPin} />
                </div>
            </div>
            
            <div className="mt-6 flex justify-end">
                <Button>Save Changes</Button>
            </div>
        </Card>
        
        <Card>
             <h3 className="text-lg font-semibold text-white mb-6">Social Links</h3>
             <div className="space-y-4">
                 <div className="flex items-center gap-4">
                     <div className="w-24 text-sm text-slate-400">LinkedIn</div>
                     <Input defaultValue="linkedin.com/in/alexmorgan" icon={Link} className="flex-1" />
                 </div>
                 <div className="flex items-center gap-4">
                     <div className="w-24 text-sm text-slate-400">Twitter</div>
                     <Input defaultValue="twitter.com/alexm_strat" icon={Link} className="flex-1" />
                 </div>
             </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
