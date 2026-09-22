import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_VIEW } from './grips';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import GameView from './views/GameView';
import ProfileView from './views/ProfileView';

export default function App() {
  const view = useGrip(CURRENT_VIEW);

  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'game':
      return <GameView />;
    case 'profile':
      return <ProfileView />;
    case 'auth':
    default:
      return <AuthView />;
  }
}
