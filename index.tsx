import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// FIX: Corrected "Cannot find name 'document'" error on line 6.
// Accessing document via window.document makes the code compatible with environments where DOM globals are not automatically available.
const rootElement = window.document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
