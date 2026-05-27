import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Mail, Phone, Calendar, DollarSign, TrendingUp, Users, FileText, Search, X, Settings } from 'lucide-react';

const InvestorTrackingSystem = () => {
  // Airtable Configuration
  const AIRTABLE_TOKEN = process.env.NEXT_PUBLIC_AIRTABLE_TOKEN;
  const BASE_ID = 'appHcZoNno7BykcLw';
  const TABLE_IDS = {
    people: 'tblYNJ09DAoF9LOkd',
    projects: 'tblyF45DiI3bKCBqD',
    coProducers: 'tblaQUGQs0xxrJSp6',
    investors: 'tblk0oNnzgQ93g5Hu',
    interactions: 'tblFH4xJOvWoWuyyh',
    snippets: 'tblPL1cntjhEIkyIz'
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from Airtable
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch People
      const peopleData = await fetchFromAirtable(TABLE_IDS.people);
      setPeople(peopleData);

      // Fetch Projects
      const projectsData = await fetchFromAirtable(TABLE_IDS.projects);
      setProjects(projectsData);

      // Fetch Project Investors
      const investorsData = await fetchFromAirtable(TABLE_IDS.investors);
      setInvestors(investorsData);

      // Fetch Interactions
      const interactionsData = await fetchFromAirtable(TABLE_IDS.interactions);
      setInteractions(interactionsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchFromAirtable = async (tableId) => {
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
        throw new Error(`Failed to fetch from ${tableId}`);
      }

      const data = await response.json();
      return data.records.map(record => ({
        id: record.id,
        fields: record.fields
      }));
    } catch (error) {
      console.error(`Error fetching from table ${tableId}:`, error);
      return [];
    }
  };

  const calculateFundingProgress = (projectId) => {
    const projectInvestors = investors.filter(inv => 
      inv.fields['Project'] && inv.fields['Project'].includes(projectId)
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
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Projects</p>
              <p className="text-4xl font-serif text-amber-400 mt-3">{projects.length}</p>
            </div>
            <TrendingUp className="text-amber-400 opacity-20" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Investors</p>
              <p className="text-4xl font-serif text-amber-400 mt-3">{people.filter(p => p.fields['Person Type'] === 'Investor').length}</p>
            </div>
            <Users className="text-amber-400 opacity-20" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Co-Producers</p>
              <p className="text-4xl font-serif text-amber-400 mt-3">{people.filter(p => p.fields['Person Type'] === 'Co-Producer').length}</p>
            </div>
            <Users className="text-amber-400 opacity-20" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Interactions</p>
              <p className="text-4xl font-serif text-amber-400 mt-3">{interactions.length}</p>
            </div>
            <Mail className="text-amber-400 opacity-20" size={40} />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-serif text-white mb-8 flex items-center gap-3">
          <TrendingUp size={24} className="text-amber-400" />
          Projects Overview
        </h2>
        <div className="space-y-8">
          {projects.map((project, idx) => {
            const { totalCommitted, totalDelivered, investorCount } = calculateFundingProgress(project.id);
            const needed = project.fields['Total Capitalization Needed'] || 1;
            const percentDelivered = (totalDelivered / needed) * 100;
            const percentCommitted = (totalCommitted / needed) * 100;

            return (
              <div key={project.id} className="border-b border-slate-700 pb-8 last:border-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-serif text-white">{project.fields['Project Name']}</h3>
                    <p className="text-sm text-slate-400 mt-1">{project.fields['Description']}</p>
                    <p className="text-sm text-slate-500 mt-2">Target: ${needed.toLocaleString()}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ml-4 ${
                    project.fields['Status'] === 'Fundraising' ? 'bg-amber-900/30 text-amber-300 border border-amber-700/50' :
                    project.fields['Status'] === 'In Development' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' :
                    'bg-green-900/30 text-green-300 border border-green-700/50'
                  }`}>
                    {project.fields['Status']}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-2">
                      <span>Delivered: ${totalDelivered.toLocaleString()} ({percentDelivered.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-amber-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(percentDelivered, 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-2">
                      <span>Committed: ${totalCommitted.toLocaleString()} ({percentCommitted.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full transition-all" style={{ width: `${Math.min(percentCommitted, 100)}%` }}></div>
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif text-white">Investors & Co-Producers</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {people
          .filter(p => 
            p.fields['Name'].toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.fields['Email'] && p.fields['Email'].toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map((person) => (
          <div 
            key={person.id} 
            className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer"
            onClick={() => setSelectedPerson(selectedPerson === person.id ? null : person.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-serif text-white">{person.fields['Name']}</h3>
                {person.fields['Organization'] && <p className="text-sm text-slate-400 mt-1">{person.fields['Organization']}</p>}
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                person.fields['Person Type'] === 'Investor' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' : 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
              }`}>
                {person.fields['Person Type']}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              {person.fields['Email'] && (
                <a href={`mailto:${person.fields['Email']}`} className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors">
                  <Mail size={14} /> {person.fields['Email']}
                </a>
              )}
              {person.fields['Phone'] && (
                <a href={`tel:${person.fields['Phone']}`} className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors">
                  <Phone size={14} /> {person.fields['Phone']}
                </a>
              )}
            </div>

            {person.fields['Tags'] && (
              <div className="flex flex-wrap gap-2 mb-4">
                {person.fields['Tags'].split(',').map(tag => (
                  <span key={tag.trim()} className="text-xs bg-amber-900/30 text-amber-300 px-3 py-1 rounded-full border border-amber-700/30">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {selectedPerson === person.id && (
              <div className="border-t border-slate-700 pt-4 mt-4 space-y-3 text-sm">
                {person.fields['Big Fish Score'] && (
                  <div>
                    <p className="text-slate-400">Big Fish Score</p>
                    <p className="text-amber-300 font-medium">{person.fields['Big Fish Score']}</p>
                  </div>
                )}
                {person.fields['Relationship Strength'] && (
                  <div>
                    <p className="text-slate-400">Relationship</p>
                    <p className="text-slate-300">{person.fields['Relationship Strength']}</p>
                  </div>
                )}
                {person.fields['Last Interaction'] && (
                  <div>
                    <p className="text-slate-400">Last Contact</p>
                    <p className="text-slate-300">{new Date(person.fields['Last Interaction']).toLocaleDateString()}</p>
                  </div>
                )}
                {person.fields['Next Action'] && (
                  <div>
                    <p className="text-slate-400">Next Action</p>
                    <p className="text-amber-300 font-medium">{person.fields['Next Action']}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const InteractionsTab = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif text-white">Interaction History</h2>
      </div>

      <div className="space-y-3">
        {interactions.slice().reverse().map((interaction) => {
          const person = people.find(p => 
            interaction.fields['Person'] && interaction.fields['Person'].includes(p.id)
          );
          const project = projects.find(p => 
            interaction.fields['Project'] && interaction.fields['Project'].includes(p.id)
          );

          return (
            <div 
              key={interaction.id} 
              className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/10"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  {person && <p className="font-serif text-lg text-white">{person.fields['Name']}</p>}
                  {project && <p className="text-sm text-amber-400 font-medium">{project.fields['Project Name']}</p>}
                </div>
                {interaction.fields['Outcome'] && (
                  <span className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    interaction.fields['Outcome'] === 'Positive' ? 'bg-green-900/30 text-green-300 border border-green-700/50' :
                    interaction.fields['Outcome'] === 'Neutral' ? 'bg-slate-700/50 text-slate-300 border border-slate-600/50' :
                    'bg-red-900/30 text-red-300 border border-red-700/50'
                  }`}>
                    {interaction.fields['Outcome']}
                  </span>
                )}
              </div>
              <p className="text-base text-slate-300 mb-3 font-medium">{interaction.fields['Subject']}</p>
              {interaction.fields['Notes'] && <p className="text-sm text-slate-400 mb-3">{interaction.fields['Notes']}</p>}
              <div className="flex gap-4 text-xs text-slate-400 border-t border-slate-700 pt-3">
                {interaction.fields['Type'] && <span className="flex items-center gap-1"><Mail size={12} /> {interaction.fields['Type']}</span>}
                {interaction.fields['Date'] && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(interaction.fields['Date']).toLocaleDateString()}</span>}
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
          <p className="text-xl font-serif mb-4">Loading your investor data...</p>
          <p className="text-sm text-slate-400">Make sure your Airtable Personal Access Token is set</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Lato:wght@300;400;500;700&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1e293b;
        }

        ::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="font-serif font-bold text-slate-900 text-xl">◆</span>
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-white">Investor Hub</h1>
                <p className="text-xs text-slate-400">Live Airtable Integration</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-slate-400">Connected</p>
              <p className="text-amber-400 font-semibold">Airtable Base</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-10 border-b border-slate-700 overflow-x-auto">
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
                className={`pb-4 px-6 font-medium flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
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

        {/* Tab Content */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'people' && <PeopleTab />}
        {activeTab === 'interactions' && <InteractionsTab />}
      </main>
    </div>
  );
};

export default InvestorTrackingSystem;
