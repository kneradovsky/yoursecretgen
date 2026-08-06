import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import CopyButton from './CopyButton';

interface LayoutProps {
  children: ReactNode;
}

const CRYPTO_WALLETS = [
  {
    label: 'ETH / USDT ERC-20',
    address: '0xDa38844fa26F1578f92da87dB694a5Fb9d6D8A10',
  },
  {
    label: 'USDT TRC-20',
    address: 'TMk88HUEf2Hnk8E1AXZLGBia7vZJ4Gu47s',
  },
];

function Layout({ children }: LayoutProps) {
  return (
    <div className="container">
      <header>
        <NavLink to="/" style={{ textDecoration: 'none' }}>
          <h1>Local Developer Tools</h1>
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
        <div className="footer-crypto">
          <span className="footer-crypto-title">Crypto donations:</span>
          <div className="footer-crypto-list">
            {CRYPTO_WALLETS.map((wallet) => (
              <div key={wallet.label} className="footer-crypto-item">
                <span className="footer-crypto-label">{wallet.label}:</span>
                <code className="footer-crypto-address">{wallet.address}</code>
                <CopyButton text={wallet.address} />
              </div>
            ))}
          </div>
        </div>
        <div className="footer-links">
          <a
            href="https://github.com/kneradovsky/yoursecretgen"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a href="https://donatr.ee/papacoder" target="_blank" rel="noopener noreferrer">
            Donate
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
