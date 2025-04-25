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

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email_address: '',
    phone_number: '',
    address: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchMembers = useCallback(async () => {
    try {
      const response = await api.get('/members/');
      setMembers(response.data);
    } catch (error) {
      showSnackbar('Error fetching members', 'error');
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpenDialog = (member = null) => {
    if (member) {
      setSelectedMember(member);
      setFormData({
        name: member.name,
        email_address: member.email_address,
        phone_number: member.phone_number,
        address: member.address,
      });
    } else {
      setSelectedMember(null);
      setFormData({
        name: '',
        email_address: '',
        phone_number: '',
        address: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMember(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (selectedMember) {
        await api.put(`/members/${selectedMember.memberID}/`, formData);
        showSnackbar('Member updated successfully', 'success');
      } else {
        await api.post('/members/', {
          ...formData,
          start_date: new Date().toISOString().split('T')[0],
        });
        showSnackbar('Member added successfully', 'success');
      }
      fetchMembers();
      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error saving member', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await api.delete(`/members/${id}/`);
        showSnackbar('Member deleted successfully', 'success');
        fetchMembers();
      } catch (error) {
        showSnackbar('Error deleting member', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const columns = [
    { field: 'memberID', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email_address', headerName: 'Email', width: 200 },
    { field: 'phone_number', headerName: 'Phone', width: 150 },
    { field: 'address', headerName: 'Address', width: 200 },
    { field: 'start_date', headerName: 'Start Date', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleOpenDialog(params.row)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.memberID)} color="error">
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Member Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Member
        </Button>
      </Box>

      <DataGrid
        rows={members}
        columns={columns}
        pageSize={10}
        getRowId={(row) => row.memberID}
        autoHeight
        disableSelectionOnClick
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedMember ? 'Edit Member' : 'Add Member'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="email_address"
            label="Email"
            type="email"
            fullWidth
            value={formData.email_address}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="phone_number"
            label="Phone Number"
            fullWidth
            value={formData.phone_number}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="address"
            label="Address"
            fullWidth
            value={formData.address}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedMember ? 'Update' : 'Add'}
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

export default MemberManagement;