import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../services/api';

const BookCatalog = () => {
  const [books, setBooks] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchBooks = useCallback(async () => {
    try {
      const response = await api.get('/books/');
      setBooks(response.data);
    } catch (error) {
      showSnackbar('Error fetching books', 'error');
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getAvailabilityChip = (available) => {
    if (available > 0) {
      return <Chip label="Available" color="success" size="small" />;
    }
    return <Chip label="Not Available" color="error" size="small" />;
  };

  const columns = [
    { field: 'bookID', headerName: 'ID', width: 90 },
    { field: 'title', headerName: 'Title', width: 250 },
    { field: 'edition', headerName: 'Edition', width: 150 },
    { field: 'total_copies', headerName: 'Total Copies', width: 130 },
    { field: 'available_copies', headerName: 'Available', width: 130 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => getAvailabilityChip(params.row.available_copies),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Book Catalog
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Please visit the library desk to borrow a book.
      </Typography>
      <DataGrid
        rows={books}
        columns={columns}
        pageSize={10}
        getRowId={(row) => row.bookID}
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

export default BookCatalog;