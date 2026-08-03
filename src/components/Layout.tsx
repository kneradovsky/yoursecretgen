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
          <h1>uuidhash</h1>
        </NavLink>
        <nav>
          <NavLink to="/uuid">UUID</NavLink>
          <NavLink to="/base64">Base64</NavLink>
          <NavLink to="/sha">SHA</NavLink>
          <NavLink to="/bcrypt">bcrypt</NavLink>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default Layout;
