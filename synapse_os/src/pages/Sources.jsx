import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Tabs from '../components/ui/Tabs';
import Table, { TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { Search, ExternalLink, Database } from 'lucide-react';

const Sources = () => {
    const [activeTab, setActiveTab] = useState('tiktok');

    const sourcesData = [
        { title: 'Sustainable Fashion Trends 2026', author: 'EcoDaily', views: '1.2M', engagement: '8.5%', collected: 'Oct 24', link: '#' },
        { title: 'Minimalist Room Tour', author: 'DesignHub', views: '850k', engagement: '12.1%', collected: 'Oct 25', link: '#' },
        { title: 'AI in Creative Arts', author: 'TechInsider', views: '2.4M', engagement: '6.3%', collected: 'Oct 26', link: '#' },
        { title: 'Future of Remote Work', author: 'WorkLife', views: '500k', engagement: '9.2%', collected: 'Oct 27', link: '#' },
        { title: 'Smart Home Gadgets Review', author: 'GadgetGeek', views: '1.8M', engagement: '7.8%', collected: 'Oct 28', link: '#' },
    ];

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-bold text-white">Data Sources</h2>
                   <p className="text-slate-400">Manage external data streams and references</p>
                </div>
                <div className="flex items-center gap-3">
                    <Input icon={Search} placeholder="Search sources..." className="w-64" />
                </div>
             </div>

             <Tabs 
                activeTab={activeTab} 
                onChange={setActiveTab}
                tabs={[
                    { id: 'tiktok', label: 'TikTok References' },
                    { id: 'blogs', label: 'Blog Sources' },
                    { id: 'authors', label: 'Authors' },
                    { id: 'papers', label: 'Academic Papers' },
                ]}
                className="w-full md:w-auto"
             />

             <Card>
                <div className="flex items-center gap-2 mb-4 text-slate-400 text-sm">
                    <Database size={14} /> Showing {sourcesData.length} active sources
                </div>
                <Table headers={['Title', 'Author', 'Views', 'Engagement', 'Collected', 'Link']}>
                    {sourcesData.map((source, idx) => (
                        <TableRow key={idx}>
                            <TableCell><span className="font-medium text-slate-200">{source.title}</span></TableCell>
                            <TableCell>{source.author}</TableCell>
                            <TableCell>{source.views}</TableCell>
                            <TableCell>
                                <Badge variant="success">{source.engagement}</Badge>
                            </TableCell>
                            <TableCell>{source.collected}</TableCell>
                            <TableCell>
                                <a href={source.link} className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-xs">
                                    View <ExternalLink size={12} />
                                </a>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
             </Card>
        </div>
    );
};

export default Sources;
