import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Settings as SettingsIcon, Bell, Lock, Users, Code, Eye } from 'lucide-react';

const Settings = () => {
    const { theme, setTheme } = useTheme();
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeSection === section.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    <section.icon size={18} />
                    {section.label}
                </button>
            ))}
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="bg-card border-border">
            {activeSection === 'organization' && (
                <>
                    <h2 className="text-xl font-bold text-foreground mb-6">Organization Details</h2>
                    <div className="space-y-6 max-w-2xl">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                            <Input defaultValue="Synapse Intelligence" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Industry</label>
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
                                <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                                <Input defaultValue="admin@synapse.ai" />
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Website</label>
                                <Input defaultValue="https://synapse.ai" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border flex justify-end gap-4">
                            <Button variant="secondary">Cancel</Button>
                            <Button>Save Changes</Button>
                        </div>
                    </div>
                </>
            )}

            {activeSection === 'appearance' && (
                <>
                    <h2 className="text-xl font-bold text-foreground mb-6">Appearance</h2>
                    <div className="space-y-6 max-w-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                                onClick={() => setTheme('light')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            >
                                <div className="w-full h-32 bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex gap-2 overflow-hidden">
                                    <div className="w-1/4 h-full bg-slate-50 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                                        <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                                <span className={`font-medium ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`}>Light Mode</span>
                            </button>

                            <button 
                                onClick={() => setTheme('dark')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            >
                                <div className="w-full h-32 bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-2 flex gap-2 overflow-hidden">
                                    <div className="w-1/4 h-full bg-slate-900 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 w-3/4 bg-slate-900 rounded"></div>
                                        <div className="h-2 w-1/2 bg-slate-900 rounded"></div>
                                    </div>
                                </div>
                                <span className={`font-medium ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`}>Dark Mode</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Card>
      </div>
    </div>
  );
};

export default Settings;
