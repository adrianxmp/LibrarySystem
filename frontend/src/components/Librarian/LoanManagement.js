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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../../services/api';

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [bookCopies, setBookCopies] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    copy: '',
    member: '',
    due_date: dayjs().add(14, 'day'),
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchLoans = useCallback(async () => {
    try {
      const response = await api.get('/loans/');
      setLoans(response.data);
    } catch (error) {
      showSnackbar('Error fetching loans', 'error');
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await api.get('/members/');
      setMembers(response.data);
    } catch (error) {
      showSnackbar('Error fetching members', 'error');
    }
  }, []);

  const fetchBookCopies = useCallback(async () => {
    try {
      const response = await api.get('/book-copies/available/');
      setBookCopies(response.data);
    } catch (error) {
      // Fallback to the original endpoint if the new one doesn't exist
      try {
        const response = await api.get('/book-copies/');
        setBookCopies(response.data.filter(copy => copy.status === 'Available'));
      } catch (error) {
        showSnackbar('Error fetching book copies', 'error');
      }
    }
  }, []);

  useEffect(() => {
    fetchLoans();
    fetchMembers();
    fetchBookCopies();
  }, [fetchLoans, fetchMembers, fetchBookCopies]);

  const handleOpenDialog = () => {
    setFormData({
      copy: '',
      member: '',
      due_date: dayjs().add(14, 'day'),
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, due_date: date });
  };

  const handleSubmit = async () => {
    try {
      await api.post('/loans/', {
        ...formData,
        due_date: formData.due_date.format('YYYY-MM-DD'),
      });
      showSnackbar('Loan created successfully', 'success');
      fetchLoans();
      fetchBookCopies();
      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error creating loan', 'error');
    }
  };

  const handleDelete = async (loanId) => {
    if (window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
      try {
        await api.delete(`/loans/${loanId}/`);
        showSnackbar('Loan deleted successfully', 'success');
        fetchLoans();
        fetchBookCopies();
      } catch (error) {
        showSnackbar(error.response?.data?.error || 'Error deleting loan', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const columns = [
    { field: 'loanID', headerName: 'ID', width: 90 },
    { field: 'member_name', headerName: 'Member', width: 200 },
    { field: 'book_title', headerName: 'Book', width: 250 },
    { field: 'issue_date', headerName: 'Issue Date', width: 130 },
    { field: 'due_date', headerName: 'Due Date', width: 130 },
    { field: 'return_date', headerName: 'Return Date', width: 130 },
    { field: 'loan_status', headerName: 'Status', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          {/* Removed the return book icon, only show delete icon */}
          <IconButton
            onClick={() => handleDelete(params.row.loanID)}
            color="error"
            title="Delete Loan"
          >
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
          <Typography variant="h4">Loan Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            New Loan
          </Button>
        </Box>

        <DataGrid
          rows={loans}
          columns={columns}
          pageSize={10}
          getRowId={(row) => row.loanID}
          autoHeight
          disableSelectionOnClick
        />

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Create New Loan</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Member</InputLabel>
              <Select
                name="member"
                value={formData.member}
                onChange={handleInputChange}
                label="Member"
              >
                {members.map((member) => (
                  <MenuItem key={member.memberID} value={member.memberID}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Book Copy</InputLabel>
              <Select
                name="copy"
                value={formData.copy}
                onChange={handleInputChange}
                label="Book Copy"
              >
                {bookCopies.map((copy) => (
                  <MenuItem key={copy.copyID} value={copy.copyID}>
                    {copy.book_title} (Copy {copy.copyID})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="Due Date"
              value={formData.due_date}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Create Loan
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

export default LoanManagement;