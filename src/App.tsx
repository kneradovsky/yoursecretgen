import { ReactNode } from 'react';
import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import UuidSection from './components/UuidSection';
import Base64Section from './components/Base64Section';
import ShaSection from './components/ShaSection';
import BcryptSection from './components/BcryptSection';
import JsonSection from './components/JsonSection';
import { useAnalytics } from './hooks/useAnalytics';
import { DEFAULT_LANG, LangProvider, isLang, type Lang } from './i18n';

function LangGate({ lang }: { lang: Lang }) {
  return (
    <LangProvider value={lang}>
      <Outlet />
    </LangProvider>
  );
}

function LangParamGate() {
  const { lang } = useParams();
  if (!isLang(lang)) {
    return <Navigate to="/" replace />;
  }
  return <LangGate lang={lang} />;
}

const SECTION_ROUTES: { path: string; element: ReactNode }[] = [
  { path: 'uuid', element: <UuidSection /> },
  { path: 'base64', element: <Base64Section /> },
  { path: 'sha', element: <ShaSection /> },
  { path: 'bcrypt', element: <BcryptSection /> },
  { path: 'json', element: <JsonSection /> },
];

function App() {
  useAnalytics();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<LangGate lang={DEFAULT_LANG} />}>
          <Route index element={<Home />} />
          {SECTION_ROUTES.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
        <Route path=":lang" element={<LangParamGate />}>
          <Route index element={<Home />} />
          {SECTION_ROUTES.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
