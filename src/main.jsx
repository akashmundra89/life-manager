import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// HashRouter (URLs like /#/grocery) is used because GitHub Pages doesn't
// natively support client-side BrowserRouter deep links — refresh on
// /grocery would otherwise 404. HashRouter works on Pages, Vercel, Netlify,
// and locally without any extra server config.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
