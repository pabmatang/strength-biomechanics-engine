import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!;

try {
  createRoot(root).render(
    <App />
  )
} catch (err) {
  console.error('[CHΔNCE] Fatal render error:', err);
  root.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;color:#94a3b8;font-family:system-ui,sans-serif">
      <div>
        <h2 style="color:#f87171;font-size:1.25rem;margin-bottom:0.5rem">Error al cargar la app</h2>
        <p style="font-size:0.875rem">${String(err)}</p>
        <button onclick="localStorage.clear();location.reload()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:#3b82f6;color:white;border:none;border-radius:0.75rem;font-weight:bold;cursor:pointer">
          Reiniciar App
        </button>
      </div>
    </div>
  `;
}
