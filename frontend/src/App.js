import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/Common/Navbar';

// Librarian Components
import LibrarianDashboard from './components/Librarian/Dashboard';
import BookManagement from './components/Librarian/BookManagement';
import MemberManagement from './components/Librarian/MemberManagement';
import LoanManagement from './components/Librarian/LoanManagement';
import EventManagement from './components/Librarian/EventManagement';
import FineManagement from './components/Librarian/FineManagement';

// Member Components
import MemberDashboard from './components/Member/Dashboard';
import MyLoans from './components/Member/MyLoans';
import BookCatalog from './components/Member/BookCatalog';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue color
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Librarian Routes */}
          <Route
            path="/librarian/*"
            element={
              <ProtectedRoute allowedRole="librarian">
                <Box sx={{ display: 'flex' }}>
                  <Navbar />
                  <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
                    <Routes>
                      <Route path="/dashboard" element={<LibrarianDashboard />} />
                      <Route path="/books" element={<BookManagement />} />
                      <Route path="/members" element={<MemberManagement />} />
                      <Route path="/loans" element={<LoanManagement />} />
                      <Route path="/events" element={<EventManagement />} />
                      <Route path="/fines" element={<FineManagement />} />
                    </Routes>
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />
          
          {/* Member Routes */}
          <Route
            path="/member/*"
            element={
              <ProtectedRoute allowedRole="member">
                <Box sx={{ display: 'flex' }}>
                  <Navbar />
                  <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
                    <Routes>
                      <Route path="/dashboard" element={<MemberDashboard />} />
                      <Route path="/my-loans" element={<MyLoans />} />
                      <Route path="/books" element={<BookCatalog />} />
                    </Routes>
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;