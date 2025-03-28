import React from 'react';
import { createRoot } from 'react-dom/client';
import AppComponent from './components/App';

// Initialize the application
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<AppComponent />);