import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../../services/api';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: dayjs(),
    end_date: dayjs(),
    event_time: dayjs(),
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get('/events/');
      setEvents(response.data);
    } catch (error) {
      showSnackbar('Error fetching events', 'error');
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleOpenDialog = (event = null) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        name: event.name,
        start_date: dayjs(event.start_date),
        end_date: dayjs(event.end_date),
        event_time: dayjs(`2022-01-01T${event.event_time}`),
      });
    } else {
      setSelectedEvent(null);
      setFormData({
        name: '',
        start_date: dayjs(),
        end_date: dayjs(),
        event_time: dayjs(),
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const eventData = {
        name: formData.name,
        start_date: formData.start_date.format('YYYY-MM-DD'),
        end_date: formData.end_date.format('YYYY-MM-DD'),
        event_time: formData.event_time.format('HH:mm:ss'),
      };

      if (selectedEvent) {
        await api.put(`/events/${selectedEvent.eventID}/`, eventData);
        showSnackbar('Event updated successfully', 'success');
      } else {
        await api.post('/events/', eventData);
        showSnackbar('Event added successfully', 'success');
      }
      fetchEvents();
      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error saving event', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/events/${id}/`);
        showSnackbar('Event deleted successfully', 'success');
        fetchEvents();
      } catch (error) {
        showSnackbar('Error deleting event', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const columns = [
    { field: 'eventID', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Event Name', width: 200 },
    { field: 'start_date', headerName: 'Start Date', width: 130 },
    { field: 'end_date', headerName: 'End Date', width: 130 },
    { field: 'event_time', headerName: 'Time', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleOpenDialog(params.row)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.eventID)} color="error">
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Event Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Event
          </Button>
        </Box>

        <DataGrid
          rows={events}
          columns={columns}
          pageSize={10}
          getRowId={(row) => row.eventID}
          autoHeight
          disableSelectionOnClick
        />

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Event Name"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              sx={{ mb: 2, mt: 1 }}
            />
            <DatePicker
              label="Start Date"
              value={formData.start_date}
              onChange={(date) => setFormData({ ...formData, start_date: date })}
              minDate={selectedEvent ? null : dayjs()}
              slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
            />
            <DatePicker
              label="End Date"
              value={formData.end_date}
              onChange={(date) => setFormData({ ...formData, end_date: date })}
              minDate={formData.start_date}
              slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
            />
            <TimePicker
              label="Event Time"
              value={formData.event_time}
              onChange={(time) => setFormData({ ...formData, event_time: time })}
              slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedEvent ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

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
    </LocalizationProvider>
  );
};

export default EventManagement;