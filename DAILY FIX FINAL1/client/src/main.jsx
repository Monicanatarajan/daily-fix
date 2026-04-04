import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Set global axios base URL so all relative /api calls hit the deployed backend
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://daily-fix-nqm0.onrender.com';
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
