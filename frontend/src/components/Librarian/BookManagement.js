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
import api from '../../services/api';

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    edition: '',
    total_copies: '',
    available_copies: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchBooks = useCallback(async () => {
    try {
      const response = await api.get('/books/');
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      showSnackbar('Error fetching books', 'error');
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleOpenDialog = (book = null) => {
    if (book) {
      console.log('Editing book:', book);
      setSelectedBook(book);
      setFormData({
        title: book.title,
        edition: book.edition,
        total_copies: book.total_copies.toString(),
        available_copies: book.available_copies.toString(),
      });
    } else {
      setSelectedBook(null);
      setFormData({
        title: '',
        edition: '',
        total_copies: '1',
        available_copies: '1',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBook(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        title: formData.title,
        edition: formData.edition,
        total_copies: parseInt(formData.total_copies) || 0,
        available_copies: parseInt(formData.available_copies) || 0,
      };

      // For updates, include the bookID
      if (selectedBook) {
        submitData.bookID = selectedBook.bookID;
      }

      console.log('Submitting book data:', submitData);

      if (selectedBook) {
        console.log('Updating book:', selectedBook.bookID);
        // Use PATCH for partial updates instead of PUT
        const response = await api.patch(`/books/${selectedBook.bookID}/`, submitData);
        console.log('Update response:', response.data);
        showSnackbar('Book updated successfully', 'success');
      } else {
        const response = await api.post('/books/', submitData);
        console.log('Create response:', response.data);
        showSnackbar('Book added successfully', 'success');
      }
      fetchBooks();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving book:', error.response?.data || error);
      const errorMessage = error.response?.data?.title?.[0] || 
                          error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Error saving book';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await api.delete(`/books/${id}/`);
        showSnackbar('Book deleted successfully', 'success');
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
        showSnackbar(error.response?.data?.error || 'Error deleting book', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const columns = [
    { field: 'bookID', headerName: 'ID', width: 90 },
    { field: 'title', headerName: 'Title', width: 250 },
    { field: 'edition', headerName: 'Edition', width: 150 },
    { field: 'total_copies', headerName: 'Total Copies', width: 130 },
    { field: 'available_copies', headerName: 'Available', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton 
            onClick={() => handleOpenDialog(params.row)} 
            color="primary"
            title="Edit Book"
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            onClick={() => handleDelete(params.row.bookID)} 
            color="error"
            title="Delete Book"
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Book Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Book
        </Button>
      </Box>

      <DataGrid
        rows={books}
        columns={columns}
        pageSize={10}
        getRowId={(row) => row.bookID}
        autoHeight
        disableSelectionOnClick
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedBook ? 'Edit Book' : 'Add Book'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Title"
            fullWidth
            value={formData.title}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="edition"
            label="Edition"
            fullWidth
            value={formData.edition}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="total_copies"
            label="Total Copies"
            type="number"
            fullWidth
            value={formData.total_copies}
            onChange={handleInputChange}
            inputProps={{ min: 0 }}
            required
          />
          <TextField
            margin="dense"
            name="available_copies"
            label="Available Copies"
            type="number"
            fullWidth
            value={formData.available_copies}
            onChange={handleInputChange}
            inputProps={{ min: 0, max: formData.total_copies }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedBook ? 'Update' : 'Add'}
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
  );
};

export default BookManagement;