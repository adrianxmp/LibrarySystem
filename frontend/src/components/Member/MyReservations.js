import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../../services/api';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    fetchMyReservations();
  }, []);

  const fetchMyReservations = async () => {
    try {
      const response = await api.get('/reservations/');
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await api.patch(`/reservations/${id}/`, { status: 'Cancelled' });
        fetchMyReservations();
      } catch (error) {
        console.error('Error cancelling reservation:', error);
      }
    }
  };

  const getStatusChip = (status) => {
    const chipProps = {
      Active: { color: 'primary', label: 'Active' },
      Fulfilled: { color: 'success', label: 'Fulfilled' },
      Cancelled: { color: 'error', label: 'Cancelled' },
    };

    return <Chip {...chipProps[status]} size="small" />;
  };

  const columns = [
    { field: 'reservationID', headerName: 'ID', width: 90 },
    { field: 'book_title', headerName: 'Book Title', width: 250 },
    { field: 'reservation_date', headerName: 'Reservation Date', width: 150 },
    { field: 'exp_return_date', headerName: 'Expected Return', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        params.row.status === 'Active' && (
          <IconButton
            onClick={() => handleCancel(params.row.reservationID)}
            color="error"
          >
            <CancelIcon />
          </IconButton>
        )
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Reservations
      </Typography>
      <DataGrid
        rows={reservations}
        columns={columns}
        pageSize={10}
        getRowId={(row) => row.reservationID}
        autoHeight
        disableSelectionOnClick
      />
    </Box>
  );
};

export default MyReservations;