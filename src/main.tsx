import ReactDOM from 'react-dom/client';
import { GripProvider } from '@owebeeone/grip-react';
import { grok, main } from './runtime';
import { registerAllTaps } from './taps/registerTaps';
import App from './App';
import './index.css';

registerAllTaps(grok);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <GripProvider grok={grok} context={main}>
    <App />
  </GripProvider>,
);
