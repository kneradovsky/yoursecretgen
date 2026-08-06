import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import UuidSection from './components/UuidSection';
import Base64Section from './components/Base64Section';
import ShaSection from './components/ShaSection';
import BcryptSection from './components/BcryptSection';
import { useAnalytics } from './hooks/useAnalytics';

function App() {
  useAnalytics();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/uuid" element={<UuidSection />} />
        <Route path="/base64" element={<Base64Section />} />
        <Route path="/sha" element={<ShaSection />} />
        <Route path="/bcrypt" element={<BcryptSection />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
