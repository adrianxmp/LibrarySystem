import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import { logout, getUserRole } from '../../services/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const userRole = getUserRole();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const librarianMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/librarian/dashboard' },
    { text: 'Books', icon: <MenuBookIcon />, path: '/librarian/books' },
    { text: 'Members', icon: <PeopleIcon />, path: '/librarian/members' },
    { text: 'Loans', icon: <AssignmentIcon />, path: '/librarian/loans' },
    { text: 'Events', icon: <EventIcon />, path: '/librarian/events' },
    // Removed Fines from the menu items
  ];

  const memberMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/member/dashboard' },
    { text: 'My Loans', icon: <AssignmentIcon />, path: '/member/my-loans' },
    { text: 'Book Catalog', icon: <MenuBookIcon />, path: '/member/books' },
  ];

  const menuItems = userRole === 'librarian' ? librarianMenuItems : memberMenuItems;

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Library of the People Management System
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;