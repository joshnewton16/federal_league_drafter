import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

// Initialize the application
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);