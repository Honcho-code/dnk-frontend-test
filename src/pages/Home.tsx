import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function Home() {
  const { quests } = useStore();
  const featuredQuests = quests.slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <div className="py-12 md:py-24 border-b border-dnk-accent/20">
        <div className="text-center space-y-8 md:space-y-12">
          <div className="mx-auto w-[280px] h-[280px] md:w-[420px] md:h-[420px]">
            <img src="/logo.png" alt="DNK" className="w-full h-full object-contain" />
          </div>
          <div className="max-w-3xl mx-auto px-4">
            <h3 className="text-2xl md:text-3xl lg:text-5xl text-dnk-primary-light font-bold mb-6 md:mb-8">
              Deploy. Compete. Earn.
            </h3>
            <p className="text-lg md:text-xl text-text-muted leading-relaxed">
              Compete with fellow Doge enthusiasts to climb the leaderboard and earn rewards.
            </p>
          </div>
          <div>
            <Link
              to="/quests"
              className="inline-block bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-6 py-3 md:px-8 md:py-4 rounded-lg font-medium text-base md:text-lg transition-colors duration-150"
            >
              Start Your First Quest →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-dnk-secondary/30 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-dnk-primary mb-2">1,000+</div>
            <div className="text-text-muted text-sm md:text-base">Active Quests</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-dnk-primary mb-2">50,000+</div>
            <div className="text-text-muted text-sm md:text-base">Community Members</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-dnk-primary mb-2">∞</div>
            <div className="text-text-muted text-sm md:text-base">Doge Eco Rewards</div>
          </div>
        </div>
      </div>

      {/* Featured Quests */}
      <div className="py-12 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-header text-dnk-primary mb-4">Featured Quests</h2>
          <p className="text-text-muted max-w-2xl mx-auto text-sm md:text-base px-4">
            Discover exciting projects and tasks. Each quest is an opportunity to earn points, showcase your skills, and climb the leaderboard rankings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {featuredQuests.map((quest) => (
            <Link
              key={quest.id}
              to={`/quest/${quest.id}`}
              className="block bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 hover:border-dnk-accent/40 overflow-hidden transition-all duration-150 hover:transform hover:scale-[1.02]"
            >
              <div className="p-4 bg-dnk-primary/10">
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-dnk-primary/20 text-dnk-primary-light">
                  {quest.category}
                </span>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-medium text-dnk-primary">{quest.title}</h3>
                <p className="text-text-muted">{quest.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <span className="text-dnk-primary-light font-medium">{quest.dogecoinAmount} DOGE</span>
                    <span className="text-orange-400 font-medium text-sm">+{quest.rewardType}</span>
                  </div>
                  <span className="text-text-muted">
                    {quest.steps.length} tasks
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 md:mt-12">
          <Link
            to="/quests"
            className="inline-block bg-dnk-primary/20 hover:bg-dnk-primary/30 text-dnk-primary-light px-6 py-3 rounded-lg font-medium transition-colors duration-150 text-sm md:text-base"
          >
            View All Quests →
          </Link>
        </div>
      </div>
    </div>
  );
}