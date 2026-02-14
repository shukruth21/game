import ValentineGame from './ValentineGame';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0118', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <ValentineGame />
    </div>
  );
}

export default App;