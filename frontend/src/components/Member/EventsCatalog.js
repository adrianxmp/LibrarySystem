import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EventIcon from '@mui/icons-material/Event';
import api from '../../services/api';

const EventsCatalog = () => {
  const [events, setEvents] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/');
      setEvents(response.data);
    } catch (error) {
      showSnackbar('Error fetching events', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const isEventPast = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const getStatusChip = (event) => {
    const today = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (endDate < today) {
      return <Chip label="Past" color="default" size="small" />;
    } else if (startDate <= today && endDate >= today) {
      return <Chip label="Ongoing" color="success" size="small" />;
    } else {
      return <Chip label="Upcoming" color="primary" size="small" />;
    }
  };

  const columns = [
    { field: 'eventID', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Event Name', width: 250 },
    { field: 'start_date', headerName: 'Start Date', width: 130 },
    { field: 'end_date', headerName: 'End Date', width: 130 },
    { field: 'event_time', headerName: 'Time', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => getStatusChip(params.row),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <EventIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          Library Events
        </Typography>
      </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Browse upcoming library events and activities.
      </Typography>
      
      <DataGrid
        rows={events}
        columns={columns}
        pageSize={10}
        getRowId={(row) => row.eventID}
        autoHeight
        disableSelectionOnClick
        loading={loading}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventsCatalog;