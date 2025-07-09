import { Link } from 'react-router-dom';

export function WizardsCircle() {
  const socialLinks = [
    {
      title: "Discord Council",
      description: "Join the grand council of wizards. Share spells, discuss ancient lore, and forge alliances with fellow magic practitioners.",
      icon: "🎭",
      color: "from-purple-500 to-indigo-600",
      link: "#",
      features: [
        "Real-time spell discussions",
        "Exclusive magical channels",
        "Live casting sessions",
        "Wizard mentorship program"
      ]
    },
    {
      title: "Mystic Twitter",
      description: "Follow the whispers of the arcane realm. Stay updated with the latest magical discoveries and mystical announcements.",
      icon: "🐦",
      color: "from-blue-400 to-cyan-500",
      link: "https://twitter.com/DnkQuest",
      features: [
        "Daily magical insights",
        "Spell announcements",
        "Community highlights",
        "Mystical memes"
      ]
    },
    {
      title: "Arcane Telegram",
      description: "Receive encrypted messages from the ancient ones. Get instant notifications about new spells and magical events.",
      icon: "📱",
      color: "from-teal-500 to-blue-600",
      link: "https://t.me/doginalnonkycex",
      features: [
        "Instant spell notifications",
        "Private magical channels",
        "Voice of the ancients",
        "Emergency magical alerts"
      ]
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="text-6xl mb-6">🏛️</div>
        <h1 className="text-4xl font-header text-dnk-primary mb-6">Wizard's Circle</h1>
        <p className="text-xl text-text-muted max-w-3xl mx-auto">
          Connect with fellow practitioners of the arcane arts. Share knowledge, forge alliances, and become part of the most powerful magical community in the realm.
        </p>
      </div>

      {/* Social Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {socialLinks.map((platform, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-dnk-accent/20 hover:border-dnk-accent/40 transition-all duration-300 hover:transform hover:scale-105"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative p-8 h-full flex flex-col">
              <div className="text-4xl mb-4">{platform.icon}</div>
              <h3 className="text-2xl font-header text-dnk-primary mb-4">{platform.title}</h3>
              <p className="text-text-muted mb-6 flex-grow">{platform.description}</p>
              
              {/* Features */}
              <div className="space-y-2 mb-6">
                {platform.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <span className="text-dnk-primary">✨</span>
                    <span className="text-sm text-text-muted">{feature}</span>
                  </div>
                ))}
              </div>
              
              <a
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-6 py-3 rounded-lg font-medium transition-colors duration-150 group-hover:transform group-hover:scale-105"
              >
                Join Now
                <span className="ml-2">→</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Community Stats */}
      <div className="bg-dnk-secondary/30 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-header text-dnk-primary mb-8 text-center">Circle Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-dnk-primary mb-2">50K+</div>
            <div className="text-text-muted">Active Wizards</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-dnk-primary mb-2">1M+</div>
            <div className="text-text-muted">Spells Cast</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-dnk-primary mb-2">24/7</div>
            <div className="text-text-muted">Magical Support</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-dnk-primary mb-2">∞</div>
            <div className="text-text-muted">Magical Possibilities</div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-dnk-primary/20 to-dnk-accent/20 rounded-2xl p-12 border border-dnk-primary/30">
          <h2 className="text-3xl font-header text-dnk-primary mb-4">Ready to Join the Circle?</h2>
          <p className="text-text-muted mb-8 max-w-2xl mx-auto">
            Become part of the most prestigious magical community. Connect with fellow wizards, share your knowledge, and unlock the secrets of the arcane arts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-8 py-4 rounded-lg font-medium text-lg transition-colors duration-150"
            >
              🎭 Join Discord Council
            </a>
            <Link
              to="/quests"
              className="inline-flex items-center justify-center bg-dnk-primary/20 hover:bg-dnk-primary/30 text-dnk-primary-light px-8 py-4 rounded-lg font-medium text-lg transition-colors duration-150"
            >
              🪄 Start Casting Spells
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 