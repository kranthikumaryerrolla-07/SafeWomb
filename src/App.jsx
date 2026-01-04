import React from 'react'

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '16px',
          letterSpacing: '-0.5px'
        }}>
          Maternal Risk AI
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#718096',
          marginBottom: '32px'
        }}>
          AI-powered maternal health monitoring system
        </p>
        <div style={{
          display: 'grid',
          gap: '16px',
          textAlign: 'left'
        }}>
          <div style={{
            padding: '20px',
            background: '#f7fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', marginBottom: '4px' }}>
              Patient Portal
            </div>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              Track health metrics and receive risk assessments
            </div>
          </div>
          <div style={{
            padding: '20px',
            background: '#f7fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', marginBottom: '4px' }}>
              Partner Access
            </div>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              Monitor your partner's health and appointments
            </div>
          </div>
          <div style={{
            padding: '20px',
            background: '#f7fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', marginBottom: '4px' }}>
              ASHA Worker Dashboard
            </div>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              Manage multiple patients and enter health data
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
