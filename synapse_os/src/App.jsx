import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Trends from './pages/Trends';
import Content from './pages/Content';
import Calendar from './pages/Calendar';
import Approvals from './pages/Approvals';
import AITools from './pages/AITools';
import Sources from './pages/Sources';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="trends" element={<Trends />} />
          <Route path="content" element={<Content />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="ai-tools" element={<AITools />} />
          <Route path="sources" element={<Sources />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
