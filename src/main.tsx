// MUST be the first import to ensure Buffer is available globally
import './polyfills';
import './index.css';
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { Web3Provider } from './components/Web3Provider';


const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
    <StrictMode>
        <Web3Provider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Web3Provider>
    </StrictMode>
); 