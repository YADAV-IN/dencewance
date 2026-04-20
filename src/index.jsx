import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { client } from './appwrite';

const root = ReactDOM.createRoot(document.getElementById('root'));

const syncStandaloneClass = () => {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  document.documentElement.classList.toggle('standalone-mode', isStandalone);
  document.body.classList.toggle('standalone-mode', isStandalone);
};

syncStandaloneClass();
window.matchMedia('(display-mode: standalone)').addEventListener?.('change', syncStandaloneClass);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail: A2HS will be unavailable without SW.
    });
  });
}

// Ping Appwrite backend on app start
typeof client.ping === 'function' && client.ping();
