import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Chip, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../services/api';

const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the new member-loans endpoint
      const response = await api.get('/member-loans/');
      console.log('My loans response:', response.data);
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error.response?.data || error);
      setError(error.response?.data?.error || 'Error fetching loans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLoans();
  }, [fetchMyLoans]);

  const getStatusChip = (status) => {
    const chipProps = {
      Borrowed: { color: 'warning', label: 'Borrowed' },
      Returned: { color: 'success', label: 'Returned' },
      Overdue: { color: 'error', label: 'Overdue' },
    };

    return <Chip {...chipProps[status] || { label: status }} size="small" />;
  };

  const columns = [
    { field: 'loanID', headerName: 'Loan ID', width: 100 },
    { field: 'book_title', headerName: 'Book Title', width: 250 },
    { field: 'issue_date', headerName: 'Issue Date', width: 130 },
    { field: 'due_date', headerName: 'Due Date', width: 130 },
    { field: 'return_date', headerName: 'Return Date', width: 130 },
    {
      field: 'loan_status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Loans
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Typography>Loading...</Typography>
      ) : loans.length === 0 ? (
        <Typography>No loans found.</Typography>
      ) : (
        <DataGrid
          rows={loans}
          columns={columns}
          pageSize={10}
          getRowId={(row) => row.loanID}
          autoHeight
          disableSelectionOnClick
        />
      )}
    </Box>
  );
};

export default MyLoans;