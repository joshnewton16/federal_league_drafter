import React from 'react';

export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);

export const InfoMessage = ({ type, message }) => (
  <div className={`info-message ${type}`}>
    {message}
  </div>
);