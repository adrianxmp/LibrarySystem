import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    { title: 'Books', icon: <MenuBookIcon sx={{ fontSize: 40 }} />, path: '/librarian/books' },
    { title: 'Members', icon: <PeopleIcon sx={{ fontSize: 40 }} />, path: '/librarian/members' },
    { title: 'Loans', icon: <AssignmentIcon sx={{ fontSize: 40 }} />, path: '/librarian/loans' },
    { title: 'Events', icon: <EventIcon sx={{ fontSize: 40 }} />, path: '/librarian/events' },
    // Removed Fines from the dashboard items array
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Librarian Dashboard
      </Typography>
      <Grid container spacing={3}>
        {dashboardItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <Typography variant="h6" sx={{ mt: 2 }}>
                {item.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;