import React, { useEffect, useState } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';
import CrudTable from './CrudTable';
const API_BASE = process.env.REACT_APP_API_URL || '';

export default function ManterClassificacao() {
  const [tipo, setTipo] = useState('DESPESA');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ descricao: '' });
  const [editId, setEditId] = useState(null);

  const loadTodos = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE}/api/classificacao`, { params: { tipo, status: 'ATIVO' } });
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar classificação');
    }
  };

  const search = async (q) => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE}/api/classificacao`, { params: { tipo, status: 'ATIVO', q } });
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro na busca');
    }
  };

  useEffect(() => { loadTodos(); }, [tipo]);

  const handleEdit = (row) => {
    setEditId(row.idClassificacao);
    setForm({ descricao: row.descricao || '' });
    setOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await axios.delete(`${API_BASE}/api/classificacao/${row.idClassificacao}`);
      loadTodos();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  const handleCreate = () => {
    setEditId(null);
    setForm({ descricao: '' });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await axios.put(`${API_BASE}/api/classificacao/${editId}`, form);
      } else {
        await axios.post(`${API_BASE}/api/classificacao`, { tipo, ...form });
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
          <ToggleButton value="RECEITA">Receita</ToggleButton>
          <ToggleButton value="DESPESA">Despesa</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="outlined" onClick={handleCreate}>Novo</Button>
      </Box>

      <CrudTable
        title="Manter Classificação"
        columns={[
          { id: 'descricao', label: 'Descrição' },
          { id: 'tipo', label: 'Tipo' },
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
        <DialogTitle>{editId ? 'Editar Classificação' : 'Nova Classificação'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <Alert severity="info">Campo STATUS oculto: será ATIVO; exclusão é lógica (INATIVO).</Alert>
          <TextField label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}