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

  const founders = [
    {
      name: "Dambar Singh",
      title: "Founder",
      description: "",
      image: "/Founders/MrDambarSingh.png"
    },
    {
      name: "Kamlesh Kumar",
      title: "Founder",
      description: "",
      image: "/Founders/MrKamleshKumar.png"
    },
    {
      name: "Shahid Hussain",
      title: "Founder",
      description: "",
      image: "/Founders/MrShahidHussain.png"
    }
  ];

  const coFounders = [
    {
      name: "Jitender Kumar",
      title: "Co-Founder",
      description: "",
      image: "/Co-Founders/MrJitenderKumar.png"
    },
    {
      name: "Pramod Kumar", 
      title: "Co-Founder",
      description: "",
      image: "/Co-Founders/MrPramodKumar.png"
    },
    {
      name: "R K Meena",
      title: "Co-Founder", 
      description: "",
      image: "/Co-Founders/MrRKMeena.png"
    }
  ];

  const leadershipTeam = [...founders, ...coFounders];

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
              <h3 className="text-2xl font-bold text-primary mb-4">1. हमारा मिशन</h3>
              <p className="text-text-secondary">
                रनिंग स्टाफ के बीच आर्थिक सहयोग और सहभागिता को बढ़ावा देकर, हर सदस्य को कठिन समय में संबल देना।
              </p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-2xl font-bold text-primary mb-4">2. हमारी दृष्टि</h3>
              <p className="text-text-secondary">
                एक ऐसा सशक्त संगठन बनाना जहाँ अधिकतर सदस्य जुड़कर विश्वास, सहयोग और प्रगति की संस्कृति को आगे बढ़ाएँ।
              </p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-2xl font-bold text-primary mb-4">3. हमारे मूल्य</h3>
              <p className="text-text-secondary">
                सहभागिता, विश्वास, निस्वार्थ सहयोग, सकारात्मक सोच और एकता ही हमारे संगठन की नींव हैं।
              </p>
            </div>
          </div>
          
        </div>
      </section>

      {/* Section 2: Quote */}
      <Quote 
        text={
          <>
            विकल्प मिलेंगे बहुत, मार्ग भटकाने के लिए l<br />
            संकल्प एक ही काफी है, मंजिल तक जाने के लिए ll
          </>
        }
        className="bg-surface"
      />

      {/* Section 3: Key Statistics */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-primary mb-4">Our Impact</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Supporting our railway family through financial assistance and solidarity
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-surface rounded-lg border border-border">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">₹25,00,000</h3>
              <p className="text-lg text-text-secondary">Total Raised So Far</p>
            </div>
            
            <div className="text-center p-8 bg-surface rounded-lg border border-border">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">156</h3>
              <p className="text-lg text-text-secondary">Members Assisted</p>
            </div>
            
            <div className="text-center p-8 bg-surface rounded-lg border border-border">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">850</h3>
              <p className="text-lg text-text-secondary">Total Members</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Quote */}
      <Quote 
        text={
          <>
            आप ही याची हैं, आप ही सदस्य हैं, <br /> आप ही पदाधिकारी हैं, और आप ही फाइनेंसर हैं।
          </>
        }
      />

      {/* Section 5: Founders */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-primary mb-4">Our Founders</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              The visionary leaders who established SFA to support our railway family
            </p>
          </div>
          
          {/* Desktop: Horizontal layout, Mobile: Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 justify-center">
            {founders.map((founder, index) => (
              <UserCard key={index} {...founder} />
            ))}
          </div>
          
          {/* Mobile: Grid */}
          <div className="grid grid-cols-2 gap-4 md:hidden">
            {founders.map((founder, index) => (
              <UserCard key={index} {...founder} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Co-Founders */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-primary mb-4">Our Co-Founders</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              The dedicated co-founders who helped build and grow our organization
            </p>
          </div>
          
          {/* Desktop: Horizontal layout, Mobile: Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 justify-center">
            {coFounders.map((coFounder, index) => (
              <UserCard key={index} {...coFounder} />
            ))}
          </div>
          
          {/* Mobile: Grid */}
          <div className="grid grid-cols-2 gap-4 md:hidden">
            {coFounders.map((coFounder, index) => (
              <UserCard key={index} {...coFounder} />
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