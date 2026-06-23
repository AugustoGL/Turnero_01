import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css' // O los estilos globales que uses

import axios from 'axios';

// Usamos proxy de Vite en desarrollo y el mismo dominio en prod
axios.defaults.baseURL = '';
// Importante para que el backend reconozca la sesión (cookies)
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)