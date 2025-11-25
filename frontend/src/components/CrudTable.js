import React, { useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Button, Typography, Alert } from '@mui/material';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort(array, comparator) {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

// columns: [{ id, label }]
// data: array of rows
// onSearch(q), onTodos(), onEdit(row), onDelete(row)
export default function CrudTable({ title, columns, data, onSearch, onTodos, onEdit, onDelete, error }) {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(columns?.[0]?.id || 'id');
  const [q, setQ] = useState('');

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField label="Busca" placeholder="Digite termos..." value={q} onChange={(e) => setQ(e.target.value)} size="small" fullWidth />
        <Button variant="contained" onClick={() => onSearch && onSearch(q)}>Buscar</Button>
        <Button variant="outlined" onClick={() => { setQ(''); onTodos && onTodos(); }}>Todos (ATIVO)</Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} sortDirection={orderBy === col.id ? order : false}>
                  <TableSortLabel active={orderBy === col.id} direction={orderBy === col.id ? order : 'asc'} onClick={() => handleSort(col.id)}>
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stableSort(data || [], getComparator(order, orderBy)).map((row) => (
              <TableRow key={row.id || row.idPessoas || row.idClassificacao || row.idMovimentoContas}>
                {columns.map((col) => (
                  <TableCell key={col.id}>{row[col.id]}</TableCell>
                ))}
                <TableCell align="right">
                  <Button size="small" onClick={() => onEdit && onEdit(row)}>Editar</Button>
                  <Button size="small" color="error" onClick={() => onDelete && onDelete(row)}>Excluir (Lógico)</Button>
                </TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>
                  <Typography variant="body2" color="text.secondary">Tabela vazia. Use Busca ou Todos.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}