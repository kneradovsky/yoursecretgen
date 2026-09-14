import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import { localizedPath, useI18n } from '../i18n';

const SITE_URL = import.meta.env.VITE_SITE_URL;

const TOOL_KEYS = ['uuid', 'base64', 'sha', 'bcrypt', 'json'] as const;

function Home() {
  const { lang, t } = useI18n();

  useSEO(t('home.seoTitle') as string, t('home.seoDescription') as string, '/');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('home.jsonLdName'),
    url: SITE_URL,
    description: t('home.jsonLdDescription'),
    sameAs: ['https://github.com/kneradovsky/yoursecretgen'],
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-website';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('jsonld-website');
      if (existing) {
        existing.remove();
      }
    };
  });

  return (
    <div className="home">
      <div className="badge">
        <span className="lock-icon" aria-hidden="true">
          🔒
        </span>
        {t('home.badge')}
      </div>

      <h1>
        {t('home.titleA')}
        <span className="gradient">{t('home.titleB')}</span>
        {t('home.titleC')}
      </h1>

      <p className="home-subtitle">{t('home.subtitle')}</p>

      <div className="features">
        {TOOL_KEYS.map((key) => (
          <Link
            key={key}
            to={localizedPath(lang, `/${key}`)}
            className="feature-card"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <h3>{t(`home.tools.${key}.title`)}</h3>
            <p>{t(`home.tools.${key}.desc`)}</p>
          </Link>
        ))}
      </div>

      <div className="seo-text">
        <p>{t('home.seoText', { b: (children) => <strong>{children}</strong> })}</p>
      </div>
    </div>
  );
}

export default Home;
