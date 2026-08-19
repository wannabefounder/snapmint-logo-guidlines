import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ContentProvider } from './lib/useContent'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ContentProvider>
      <App />
    </ContentProvider>
  </React.StrictMode>,
)
