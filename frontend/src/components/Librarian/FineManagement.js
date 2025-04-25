import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PaymentIcon from '@mui/icons-material/Payment';
import api from '../../services/api';

const FineManagement = () => {
  const [fines, setFines] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchFines = useCallback(async () => {
    try {
      const response = await api.get('/fines/');
      setFines(response.data);
    } catch (error) {
      showSnackbar('Error fetching fines', 'error');
    }
  }, []);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const handlePayFine = async (fineId) => {
    try {
      await api.post(`/fines/${fineId}/pay_fine/`);
      showSnackbar('Fine marked as paid', 'success');
      fetchFines();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error paying fine', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusChip = (status) => {
    const chipProps = {
      Unpaid: { color: 'error', label: 'Unpaid' },
      Paid: { color: 'success', label: 'Paid' },
    };

    return <Chip {...chipProps[status]} size="small" />;
  };

  const columns = [
    { field: 'fineID', headerName: 'Fine ID', width: 100 },
    { field: 'member_name', headerName: 'Member', width: 200 },
    { field: 'book_title', headerName: 'Book', width: 250 },
    { field: 'amount', headerName: 'Amount', width: 120, 
      renderCell: (params) => `$${params.value.toFixed(2)}` 
    },
    { field: 'days_overdue', headerName: 'Days Overdue', width: 130 },
    {
      field: 'payment_status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
    { field: 'payment_date', headerName: 'Payment Date', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        params.row.payment_status === 'Unpaid' && (
          <Button
            variant="contained"
            size="small"
            startIcon={<PaymentIcon />}
            onClick={() => handlePayFine(params.row.fineID)}
          >
            Pay Fine
          </Button>
        )
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Fine Management
      </Typography>
      
      <DataGrid
        rows={fines}
        columns={columns}
        pageSize={10}
        getRowId={(row) => row.fineID}
        autoHeight
        disableSelectionOnClick
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

export default FineManagement;