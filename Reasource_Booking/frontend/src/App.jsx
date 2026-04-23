import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './styles/global.css';

// Pages (to be created)
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BookRoom from './pages/BookRoom';
import MyBookings from './pages/MyBookings';
import ManagerRequests from './pages/ManagerRequests';
import AdminDashboard from './pages/AdminDashboard';
import ManageRooms from './pages/ManageRooms';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/book-room" element={
            <ProtectedRoute roles={['employee', 'manager', 'admin']}>
              <BookRoom />
            </ProtectedRoute>
          } />
          
          <Route path="/my-bookings" element={
            <ProtectedRoute roles={['employee', 'manager', 'admin']}>
              <MyBookings />
            </ProtectedRoute>
          } />
          
          <Route path="/manager/requests" element={
            <ProtectedRoute roles={['manager', 'admin']}>
              <ManagerRequests />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/rooms" element={
            <ProtectedRoute roles={['admin']}>
              <ManageRooms />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
