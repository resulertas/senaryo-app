import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Yeni bir sürüm mevcut. Güncellemek ister misiniz?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Uygulama çevrimdışı kullanıma hazır.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
