import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import UploadForm from './components/UploadForm';
import SearchResults from './pages/SearchResults';
import Recommendations from './components/Recommendations';

function App() {
  return (
    // Only ONE Router at the top level
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-subtle-gradient">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/upload" element={<UploadForm />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/recommendations" element={<Recommendations />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;