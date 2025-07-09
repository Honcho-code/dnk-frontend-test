import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Quests } from './pages/Quests';
import { QuestDetail } from './pages/QuestDetail';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import EditQuest from './pages/EditQuest';
import { WizardsCircle } from './pages/WizardsCircle';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/quest/:id" element={<QuestDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/edit/:id" element={<EditQuest />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wizards-circle" element={<WizardsCircle />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;