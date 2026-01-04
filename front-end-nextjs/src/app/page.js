'use client'

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [url, setUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const encoded = encodeURIComponent(url);
    const response = await axios.post(`/api/generate-qr/?url=${encoded}`);
    console.log('response', response);
    if (!response || !response.data) {
      console.error('Empty response', response);
      return;
    }
    const { qr_code_url } = response.data;
    if (!qr_code_url) {
      console.error('qr_code_url missing', response.data);
      setError('No QR URL returned from server');
      return;
    }
    setQrCodeUrl(qr_code_url);
  } catch (error) {
    console.error('API error', error?.response?.status, error?.response?.data || error.message);
    setError(error?.response?.data?.error || error?.message || 'Request failed');
  }
};
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>QR Code Generator</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL like https://example.com"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Generate QR Code</button>
      </form>
      {error && <div style={{color: 'salmon', marginTop: 12}}>{error}</div>}
      {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" style={styles.qrCode} />}
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    color: 'white',
  },
  title: {
    margin: '0',
    lineHeight: '1.15',
    fontSize: '4rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: 'none',
    marginTop: '20px',
    width: '300px',
    color: '#121212'

  },
  button: {
    padding: '10px 20px',
    marginTop: '20px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#0070f3',
    color: 'white',
    cursor: 'pointer',
  },
  qrCode: {
    marginTop: '20px',
  },
};