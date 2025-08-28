import React from 'react';
import Navbar from '../components/Navbar';
import RevenueCard from '../components/RevenueCard';
import MembersCard from '../components/MembersCard';
import DashboardTable from '../components/DashboardTable';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Main Content */}
      <main className="pt-20 pb-6">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-text-primary mb-1">Dashboard Overview</h1>
            <p className="text-text-secondary text-sm">Monitor your business performance in real-time</p>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Cards */}
            <div className="space-y-4">
              <RevenueCard />
              <MembersCard />
            </div>

            {/* Right Column - Table */}
            <div className="lg:col-span-1">
              <DashboardTable />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;