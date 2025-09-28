import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login-Simple';
import Dashboard from './pages/Dashboard-Simple';

export default function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/*" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
