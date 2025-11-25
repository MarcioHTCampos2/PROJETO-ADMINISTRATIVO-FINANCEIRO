import React, { useEffect, useState } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';
import CrudTable from './CrudTable';
const API_BASE = process.env.REACT_APP_API_URL || '';

export default function ManterContas() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tipo: '', numeronotafiscal: '', dataemissao: '', descricao: '', valortotal: '' });
  const [editId, setEditId] = useState(null);

  const loadTodos = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE}/api/contas`, { params: { status: 'ATIVO' } });
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar contas');
    }
  };

  const search = async (q) => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE}/api/contas`, { params: { status: 'ATIVO', q } });
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro na busca');
    }
  };

  useEffect(() => { loadTodos(); }, []);

  const handleEdit = (row) => {
    setEditId(row.idMovimentoContas);
    setForm({ tipo: row.tipo || '', numeronotafiscal: row.numeronotafiscal || '', dataemissao: row.dataemissao?.slice(0,10) || '', descricao: row.descricao || '', valortotal: row.valortotal || '' });
    setOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await axios.delete(`${API_BASE}/api/contas/${row.idMovimentoContas}`);
      loadTodos();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await axios.put(`${API_BASE}/api/contas/${editId}`, { ...form });
        setOpen(false);
        loadTodos();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" disabled>Novo (via processamento PDF)</Button>
      </Box>

      <CrudTable
        title="Manter Contas"
        columns={[
          { id: 'tipo', label: 'Tipo' },
          { id: 'numeronotafiscal', label: 'NF' },
          { id: 'dataemissao', label: 'Emissão' },
          { id: 'descricao', label: 'Descrição' },
          { id: 'valortotal', label: 'Valor Total' },
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
        <DialogTitle>Editar Movimento de Conta</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <Alert severity="info">Campo STATUS oculto: permanece como está; exclusão é lógica (INATIVO).</Alert>
          <TextField label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} fullWidth />
          <TextField label="NF" value={form.numeronotafiscal} onChange={(e) => setForm({ ...form, numeronotafiscal: e.target.value })} fullWidth />
          <TextField label="Emissão" type="date" value={form.dataemissao} onChange={(e) => setForm({ ...form, dataemissao: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} fullWidth />
          <TextField label="Valor Total" type="number" value={form.valortotal} onChange={(e) => setForm({ ...form, valortotal: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}