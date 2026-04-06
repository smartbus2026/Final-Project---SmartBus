import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// 👇 ضيف السطر ده عشان يستدعي الـ AuthProvider اللي إنت عملته
import { AuthProvider } from './context/AuthContext' 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 👇 غلف الـ App بالـ AuthProvider هنا */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)