import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Inbox from './pages/Inbox.jsx';
import Conversation from './pages/Conversation.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import Reminders from './pages/Reminders.jsx';
import Users from './pages/Users.jsx';
import Roles from './pages/Roles.jsx';
import ChannelAccounts from './pages/ChannelAccounts.jsx';
import Profile from './pages/Profile.jsx';
import Clients from './pages/Clients.jsx';
import Reports from './pages/Reports.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/inbox/:id" element={<Conversation />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/channels"
          element={
            <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
              <ChannelAccounts />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div className="p-8">Not found</div>} />
      </Route>
    </Routes>
  );
}
