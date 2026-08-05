import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="container">
      <header>
        <NavLink to="/" style={{ textDecoration: 'none' }}>
          <h1>Yours only Generators</h1>
        </NavLink>
        <nav>
          <NavLink to="/uuid">UUID</NavLink>
          <NavLink to="/base64">Base64</NavLink>
          <NavLink to="/sha">SHA</NavLink>
          <NavLink to="/bcrypt">B-Crypt</NavLink>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <p className="footer-privacy">
          All transformations are performed in your browser only. No data sent to any server.
        </p>
        <div className="footer-links">
          <a
            href="https://github.com/kneradovsky/yoursecretgen"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a href="https://donatr.ee/kneradovsky" target="_blank" rel="noopener noreferrer">
            Donate
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
