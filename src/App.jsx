import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterRolePage from "./pages/RegisterRolePage";
import RegisterFormPage from "./pages/RegisterFormPage";

import UserMarketplace from "./pages/UserMarketplace";
import HomemakerMarketplace from "./pages/HomemakerMarketplace";
const API_URL = import.meta.env.VITE_API_URL;

fetch(`${API_URL}/api/endpoint`)
  .then(res => res.json())
  .then(data => console.log(data));
function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterRolePage />} />
          <Route path="/register/form" element={<RegisterFormPage />} />
          <Route path="/user/marketplace" element={<UserMarketplace />} />
          <Route path="/homemaker/marketplace" element={<HomemakerMarketplace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
