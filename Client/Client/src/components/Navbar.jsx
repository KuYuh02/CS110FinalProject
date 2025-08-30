import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-md py-2">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              SnapShare
            </Link>
          </div>
          
          <div className="flex items-center flex-grow justify-center px-4">
            <SearchBar />
          </div>
          
          <div className="flex items-center space-x-8">
            {user ? (
              <>
                <Link to="/upload" className="button-primary button-secondary">
                  Upload
                </Link>
                <Link to="/recommendations" className="button-primary button-secondary">
                  💡 Recommendations
                </Link>
                <Link to={`/profile/${user.id}`} className="button-primary button-secondary">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="button-primary button-danger"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="button-primary button-secondary">
                  Login
                </Link>
                <Link to="/signup" className="button-primary">
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;