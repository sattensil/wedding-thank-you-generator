import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#f6f7f6',
          color: '#2f3d2f',
          border: '1px solid #c7d2c7',
        },
      }}
    />
  </React.StrictMode>,
)

