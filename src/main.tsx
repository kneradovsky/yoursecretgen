import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Static hosts often expose prerendered pages as /route/index.html.
// React Router only knows exact routes like /uuid, so a URL of
// /uuid/index.html would fall through to the <Navigate to="/" /> fallback
// and the user would see the home page instead of the section. Normalize
// the URL before the router sees it (skip file://, where BrowserRouter
// doesn't work and we want the static HTML to stay visible).
if (window.location.protocol !== 'file:') {
  const pathname = window.location.pathname;
  if (pathname !== '/' && pathname.endsWith('/')) {
    const normalized = pathname.slice(0, -1) + window.location.search + window.location.hash;
    window.history.replaceState(null, '', normalized);
  } else if (pathname.endsWith('/index.html')) {
    const normalized = pathname.slice(0, -10) + window.location.search + window.location.hash;
    window.history.replaceState(null, '', normalized);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
