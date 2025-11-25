import React, { useState } from 'react';

export default function AdminSetupLLMKey() {
  const [key, setKey] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await fetch('/api/admin/llm-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Setup-Token': token.trim(),
        },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao configurar a chave');
      setStatus('Chave configurada com sucesso para esta execução.');
      setKey('');
      setToken('');
    } catch (err) {
      setStatus(`Erro: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Configurar LLM Key (Admin)</h3>
      <p>Esta configuração não persiste em disco e vale apenas para o processo atual do backend.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>
            LLM API Key:
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Informe sua chave"
              style={{ marginLeft: 8, width: 300 }}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>
            Setup Token (Admin):
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Informe o token"
              style={{ marginLeft: 8, width: 300 }}
              required
            />
          </label>
        </div>
        <button type="submit">Enviar</button>
      </form>
      {status && <p style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}