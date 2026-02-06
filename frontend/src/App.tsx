import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Sistema de Narração de Livro - Frontend</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
