import React, { useEffect, useState } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';
import CrudTable from './CrudTable';
const API_BASE = process.env.REACT_APP_API_URL || '';

export default function ManterPessoas() {
  const [tipo, setTipo] = useState('CLIENTE-FORNECEDOR');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ razaosocial: '', fantasia: '', documento: '' });
  const [editId, setEditId] = useState(null);

  const loadTodos = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE}/api/pessoas`, { params: { tipo, status: 'ATIVO' } });
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar pessoas');
    }
  };

  const search = async (q) => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE}/api/pessoas`, { params: { tipo, status: 'ATIVO', q } });
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro na busca');
    }
  };

  useEffect(() => { loadTodos(); }, [tipo]);

  const handleEdit = (row) => {
    setEditId(row.idPessoas);
    setForm({ razaosocial: row.razaosocial || '', fantasia: row.fantasia || '', documento: row.documento || '' });
    setOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await axios.delete(`${API_BASE}/api/pessoas/${row.idPessoas}`);
      loadTodos();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  const handleCreate = () => {
    setEditId(null);
    setForm({ razaosocial: '', fantasia: '', documento: '' });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await axios.put(`${API_BASE}/api/pessoas/${editId}`, form);
      } else {
        await axios.post(`${API_BASE}/api/pessoas`, { tipo, ...form });
      }
      setOpen(false);
      loadTodos();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <ToggleButtonGroup value={tipo} exclusive onChange={(e, val) => val && setTipo(val)} size="small">
          <ToggleButton value="CLIENTE-FORNECEDOR">Fornecedor</ToggleButton>
          <ToggleButton value="CLIENTE-FORNECEDOR">Cliente</ToggleButton>
          <ToggleButton value="FATURADO">Faturado</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="outlined" onClick={handleCreate}>Novo</Button>
      </Box>

      <CrudTable
        title="Manter Pessoas"
        columns={[
          { id: 'razaosocial', label: 'Razão Social/Nome' },
          { id: 'fantasia', label: 'Fantasia' },
          { id: 'documento', label: 'Documento' },
          { id: 'status', label: 'Status' },
        ]}
        data={rows}
        onSearch={search}
        onTodos={loadTodos}
        onEdit={handleEdit}
        onDelete={handleDelete}
        error={error}
      />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Editar Pessoa' : 'Nova Pessoa'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <Alert severity="info">Campo STATUS oculto: será ATIVO; exclusão é lógica (INATIVO).</Alert>
          <TextField label="Razão Social/Nome" value={form.razaosocial} onChange={(e) => setForm({ ...form, razaosocial: e.target.value })} fullWidth />
          <TextField label="Fantasia" value={form.fantasia} onChange={(e) => setForm({ ...form, fantasia: e.target.value })} fullWidth />
          <TextField label="Documento (CNPJ/CPF)" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}