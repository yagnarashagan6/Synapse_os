import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Settings as SettingsIcon, Bell, Lock, Users, Code, Eye } from 'lucide-react';

const Settings = () => {
    const [activeSection, setActiveSection] = useState('organization');

    const sections = [
        { id: 'organization', label: 'Organization', icon: Users },
        { id: 'team', label: 'Team', icon: Users }, // Reusing icon for simplicity
        { id: 'api', label: 'API Keys', icon: Code },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Eye },
        { id: 'security', label: 'Security', icon: Lock },
    ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Card className="p-2 space-y-1">
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeSection === section.id ? 'bg-purple-600/20 text-purple-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                    <section.icon size={18} />
                    {section.label}
                </button>
            ))}
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card>
            <h2 className="text-xl font-bold text-white mb-6">Organization Details</h2>
            <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Organization Name</label>
                    <Input defaultValue="Synapse Intelligence" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Industry</label>
                    <Select 
                        options={[
                            { value: 'tech', label: 'Technology & AI' },
                            { value: 'marketing', label: 'Digital Marketing' },
                            { value: 'finance', label: 'Finance' },
                        ]}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Contact Email</label>
                        <Input defaultValue="admin@synapse.ai" />
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Website</label>
                        <Input defaultValue="https://synapse.ai" />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-700/50 flex justify-end gap-4">
                    <Button variant="secondary">Cancel</Button>
                    <Button>Save Changes</Button>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
