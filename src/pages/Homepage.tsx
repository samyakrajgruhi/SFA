import React from 'react';
import Navbar from '../components/Navbar';
import UserCard from '../components/UserCard';
import Quote from '../components/Quote';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Homepage = () => {
  const assistedMembers = [
    {
      name: "Ravi Kumar",
      title: "Emergency Medical Support",
      description: "Received financial assistance for urgent medical treatment, helping him get back on his feet during a critical time.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format"
    },
    {
      name: "Sunita Devi",
      title: "Educational Support",
      description: "Got help with her children's school fees and educational expenses, ensuring their bright future continues.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format"
    },
    {
      name: "Mohan Singh",
      title: "Housing Emergency",
      description: "Received support for urgent home repairs after monsoon damage, keeping his family safe and secure.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format"
    },
    {
      name: "Priya Sharma",
      title: "Medical Treatment",
      description: "Financial assistance for specialized medical treatment helped her recover and return to work successfully.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format"
    }
  ];

  const leadershipTeam = [
    {
      name: "Rajesh Kumar Gupta",
      title: "Founder & President",
      description: "With 25+ years in railway service, Rajesh founded SFA to create a support network for railway employees across all divisions.",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face&auto=format"
    },
    {
      name: "Mamta Singh",
      title: "Co-Founder & Secretary",
      description: "A dedicated advocate for employee welfare, Mamta manages operations and ensures transparent fund distribution.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face&auto=format"
    },
    {
      name: "Amit Verma",
      title: "Treasurer",
      description: "Financial expert with deep understanding of railway systems, ensuring every rupee is accounted for and properly utilized.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face&auto=format"
    },
    {
      name: "Dr. Sunita Joshi",
      title: "Welfare Coordinator",
      description: "Former railway medical officer who coordinates medical assistance and emergency support for members in need.",
      image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face&auto=format"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Section 1: Logo and Introduction */}
      <section className="pt-20 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <img 
              src="/SFA-updateLogo.png" 
              alt="SFA Logo" 
              className="w-32 h-32 mx-auto mb-6 object-contain"
            />
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6">
              Special Finance Assistance Group
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-4xl mx-auto leading-relaxed">
              Empowering railway employees through financial solidarity and mutual support
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6">
              <h3 className="text-2xl font-bold text-primary mb-4">Our Mission</h3>
              <p className="text-text-secondary">
                To provide immediate financial assistance to railway employees during emergencies, 
                ensuring no one faces hardship alone.
              </p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-2xl font-bold text-primary mb-4">Our Vision</h3>
              <p className="text-text-secondary">
                Creating a strong financial safety net across all railway divisions, 
                fostering unity and mutual support among employees.
              </p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-2xl font-bold text-primary mb-4">Our Values</h3>
              <p className="text-text-secondary">
                Transparency, solidarity, and swift assistance. Every contribution matters, 
                every member counts, and every need is addressed promptly.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link to="/payment">
              <Button size="lg" className="px-8 py-4 text-lg">
                Join SFA Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: Quote */}
      <Quote 
        text="Unity is strength, and when we stand together, no challenge is too big to overcome."
        author="SFA Founding Principle"
        className="bg-surface"
      />

      {/* Section 3: Members Assisted */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-primary mb-4">Members We've Assisted</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Real stories of how SFA has made a difference in the lives of our railway family members
            </p>
          </div>
          
          {/* Desktop: Horizontal layout, Mobile: 2x2 grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-6">
            {assistedMembers.map((member, index) => (
              <UserCard key={index} {...member} />
            ))}
          </div>
          
          {/* Mobile: 2x2 grid */}
          <div className="grid grid-cols-2 gap-4 md:hidden">
            {assistedMembers.map((member, index) => (
              <UserCard key={index} {...member} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Quote */}
      <Quote 
        text="The best way to find yourself is to lose yourself in the service of others."
        author="Mahatma Gandhi"
      />

      {/* Section 5: Leadership Team */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-primary mb-4">Our Leadership Team</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Meet the dedicated individuals who guide SFA's mission and ensure every member gets the support they need
            </p>
          </div>
          
          {/* Desktop: Horizontal layout, Mobile: 2x2 grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-6">
            {leadershipTeam.map((leader, index) => (
              <UserCard key={index} {...leader} />
            ))}
          </div>
          
          {/* Mobile: 2x2 grid */}
          <div className="grid grid-cols-2 gap-4 md:hidden">
            {leadershipTeam.map((leader, index) => (
              <UserCard key={index} {...leader} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <img 
              src="/SFA-updateLogo.png" 
              alt="SFA Logo" 
              className="w-16 h-16 mx-auto mb-4 object-contain"
            />
            <h3 className="text-xl font-bold text-text-primary mb-2">SFA</h3>
            <p className="text-text-secondary">Special Finance Assistance Group</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Link to="/lobby-data" className="text-text-secondary hover:text-primary transition-colors">
              Lobby Data
            </Link>
            <Link to="/user-info" className="text-text-secondary hover:text-primary transition-colors">
              User Info
            </Link>
            <Link to="/payment" className="text-text-secondary hover:text-primary transition-colors">
              Make Payment
            </Link>
          </div>
          
          <div className="text-text-muted text-sm">
            <p>&copy; 2024 Special Finance Assistance Group. Supporting railway employees across all divisions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;