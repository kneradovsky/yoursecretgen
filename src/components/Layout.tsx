import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
//import CopyButton from './CopyButton';
import { LANGS, localizedPath, stripLangPrefix, useI18n } from '../i18n';

// const CRYPTO_WALLETS = [
//   {
//     label: 'ETH / USDT ERC-20',
//     address: '0xDa38844fa26F1578f92da87dB694a5Fb9d6D8A10',
//   },
//   {
//     label: 'USDT TRC-20',
//     address: 'TMk88HUEf2Hnk8E1AXZLGBia7vZJ4Gu47s',
//   },
// ];

function Layout() {
  const { lang, t } = useI18n();
  const { pathname } = useLocation();
  const sectionPath = stripLangPrefix(pathname);

  return (
    <div className="container">
      <header>
        <NavLink to={localizedPath(lang, '/')} style={{ textDecoration: 'none' }}>
          <h1>{t('siteTitle')}</h1>
        </NavLink>
        <div className="lang-switcher" aria-label="Language">
          {LANGS.map((lang) =>
            localizedPath(lang, sectionPath) === pathname ? (
              <span key={lang} className="lang-current" aria-current="true">
                {lang.toUpperCase()}
              </span>
            ) : (
              <Link key={lang} to={localizedPath(lang, sectionPath)} lang={lang}>
                {lang.toUpperCase()}
              </Link>
            )
          )}
        </div>
        <nav>
          <NavLink to={localizedPath(lang, '/uuid')}>{t('nav.uuid')}</NavLink>
          <NavLink to={localizedPath(lang, '/base64')}>{t('nav.base64')}</NavLink>
          <NavLink to={localizedPath(lang, '/sha')}>{t('nav.sha')}</NavLink>
          <NavLink to={localizedPath(lang, '/bcrypt')}>{t('nav.bcrypt')}</NavLink>
          <NavLink to={localizedPath(lang, '/json')}>{t('nav.json')}</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <p className="footer-privacy">{t('footer.privacy')}</p>
        {/* <div className="footer-crypto">
          <span className="footer-crypto-title">{t('footer.cryptoTitle')}</span>
          <div className="footer-crypto-list">
            {CRYPTO_WALLETS.map((wallet) => (
              <div key={wallet.label} className="footer-crypto-item">
                <span className="footer-crypto-label">{wallet.label}:</span>
                <code className="footer-crypto-address">{wallet.address}</code>
                <CopyButton text={wallet.address} />
              </div>
            ))}
          </div>
        </div> */}
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
