import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <div className="relative">
          <div className="bg-shapes"></div>
          <App />
        </div>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);