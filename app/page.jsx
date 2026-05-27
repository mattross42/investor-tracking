'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, TrendingUp, Users, Search } from 'lucide-react';

export default function InvestorTracking() {
  const AIRTABLE_TOKEN = process.env.NEXT_PUBLIC_AIRTABLE_TOKEN;
  const BASE_ID = 'appHcZoNno7BykcLw';
  
  const TABLE_IDS = {
    people: 'tblYNJ09DAoF9LOkd',
    projects: 'tblyF45DiI3bKCBqD',
    investors: 'tblk0oNnzgQ93g5Hu',
    interactions: 'tblFH4xJOvWoWuyyh'
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchFromAirtable = async (tableId) => {
    if (!AIRTABLE_TOKEN) {
      throw new Error('Airtable token not configured');
    }

    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${tableId}`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from Airtable: ${response.statusText}`);
      }

      const data = await response.json();
      return data.records || [];
    } catch (err) {
      console.error(`Error fetching ${tableId}:`, err);
      return [];
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [peopleData, projectsData, investorsData, interactionsData] = await Promise.all([
        fetchFromAirtable(TABLE_IDS.people),
        fetchFromAirtable(TABLE_IDS.projects),
        fetchFromAirtable(TABLE_IDS.investors),
        fetchFromAirtable(TABLE_IDS.interactions)
      ]);

      setPeople(peopleData);
      setProjects(projectsData);
      setInvestors(investorsData);
      setInteractions(interactionsData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFundingProgress = (projectId) => {
    const projectInvestors = investors.filter(inv => 
      inv.fields && inv.fields.Project && inv.fields.Project.includes(projectId)
    );
    
    const totalCommitted = projectInvestors.reduce((sum, inv) => 
      sum + (inv.fields['Committed Amount'] || 0), 0
    );
    
    const totalDelivered = projectInvestors.reduce((sum, inv) => 
      sum + (inv.fields['Delivered Amount'] || 0), 0
    );

    return { totalCommitted, totalDelivered, investorCount: projectInvestors.length };
  };

  const Dashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-colors">
          <p className="text-slate-400 text-sm">Active Projects</p>
          <p className="text-4xl font-bold text-amber-400 mt-3">{projects.length}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-colors">
          <p className="text-slate-400 text-sm">Total Investors</p>
          <p className="text-4xl font-bold text-amber-400 mt-3">
            {people.filter(p => p.fields && p.fields['Person Type'] === 'Investor').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-colors">
          <p className="text-slate-400 text-sm">Co-Producers</p>
          <p className="text-4xl font-bold text-amber-400 mt-3">
            {people.filter(p => p.fields && p.fields['Person Type'] === 'Co-Producer').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-colors">
          <p className="text-slate-400 text-sm">Interactions</p>
          <p className="text-4xl font-bold text-amber-400 mt-3">{interactions.length}</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Projects Overview</h2>
        <div className="space-y-8">
          {projects.map((project) => {
            const { totalCommitted, totalDelivered, investorCount } = calculateFundingProgress(project.id);
            const needed = project.fields['Total Capitalization Needed'] || 1;
            const percentDelivered = (totalDelivered / needed) * 100;
            const percentCommitted = (totalCommitted / needed) * 100;

            return (
              <div key={project.id} className="border-b border-slate-700 pb-8 last:border-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{project.fields['Project Name']}</h3>
                    <p className="text-sm text-slate-400 mt-1">{project.fields['Description']}</p>
                    <p className="text-sm text-slate-500 mt-2">Target: ${needed.toLocaleString()}</p>
                  </div>
                  <span className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-900/30 text-amber-300 border border-amber-700/50 whitespace-nowrap ml-4">
                    {project.fields['Status']}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-2">
                      <span>Delivered: ${totalDelivered.toLocaleString()} ({percentDelivered.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-amber-500 h-3 rounded-full transition-all" 
                        style={{ width: `${Math.min(percentDelivered, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-2">
                      <span>Committed: ${totalCommitted.toLocaleString()} ({percentCommitted.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full transition-all" 
                        style={{ width: `${Math.min(percentCommitted, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-300 mt-4 pt-4 border-t border-slate-700">
                  <span className="flex items-center gap-2"><Users size={16} className="text-amber-400" /> {investorCount} Investors</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const PeopleTab = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Investors & Co-Producers</h2>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {people
          .filter(p => 
            p.fields && (
              (p.fields.Name && p.fields.Name.toLowerCase().includes(searchTerm.toLowerCase())) || 
              (p.fields.Email && p.fields.Email.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          )
          .map((person) => (
          <div key={person.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{person.fields.Name}</h3>
                {person.fields.Organization && <p className="text-sm text-slate-400 mt-1">{person.fields.Organization}</p>}
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/50 whitespace-nowrap">
                {person.fields['Person Type']}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {person.fields.Email && (
                <a href={`mailto:${person.fields.Email}`} className="flex items-center gap-2 text-slate-300 hover:text-amber-400">
                  <Mail size={14} /> {person.fields.Email}
                </a>
              )}
              {person.fields.Phone && (
                <a href={`tel:${person.fields.Phone}`} className="flex items-center gap-2 text-slate-300 hover:text-amber-400">
                  <Phone size={14} /> {person.fields.Phone}
                </a>
              )}
            </div>

            {person.fields['Big Fish Score'] && (
              <div className="mt-3 pt-3 border-t border-slate-700 text-sm">
                <p className="text-slate-400">Score: <span className="text-amber-300 font-medium">{person.fields['Big Fish Score']}</span></p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const InteractionsTab = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Interaction History</h2>

      <div className="space-y-3">
        {interactions.slice().reverse().map((interaction) => {
          const person = people.find(p => 
            interaction.fields && interaction.fields.Person && interaction.fields.Person.includes(p.id)
          );
          const project = projects.find(p => 
            interaction.fields && interaction.fields.Project && interaction.fields.Project.includes(p.id)
          );

          return (
            <div key={interaction.id} className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  {person && <p className="font-bold text-lg text-white">{person.fields.Name}</p>}
                  {project && <p className="text-sm text-amber-400">{project.fields['Project Name']}</p>}
                </div>
                {interaction.fields.Outcome && (
                  <span className="px-4 py-2 rounded-lg text-xs font-semibold bg-green-900/30 text-green-300 border border-green-700/50 whitespace-nowrap">
                    {interaction.fields.Outcome}
                  </span>
                )}
              </div>
              <p className="text-base text-slate-300 mb-3 font-medium">{interaction.fields.Subject}</p>
              {interaction.fields.Notes && <p className="text-sm text-slate-400 mb-3">{interaction.fields.Notes}</p>}
              <div className="flex gap-4 text-xs text-slate-400 border-t border-slate-700 pt-3">
                {interaction.fields.Type && <span className="flex items-center gap-1"><Mail size={12} /> {interaction.fields.Type}</span>}
                {interaction.fields.Date && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(interaction.fields.Date).toLocaleDateString()}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Loading your investor data...</p>
          <p className="text-sm text-slate-400">Connecting to Airtable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4 text-red-400">Connection Error</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <p className="text-sm text-slate-500">Check that your Airtable token is configured in Vercel settings</p>
          <button 
            onClick={fetchAllData}
            className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap');
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                <span className="font-bold text-slate-900 text-xl">◆</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Investor Hub</h1>
                <p className="text-xs text-slate-400">Theatre Production Tracker</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Navigation */}
        <div className="flex gap-1 mb-10 border-b border-slate-700">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'people', label: 'People', icon: Users },
            { id: 'interactions', label: 'Interactions', icon: Mail }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-6 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'people' && <PeopleTab />}
        {activeTab === 'interactions' && <InteractionsTab />}
      </main>
    </div>
  );
}
