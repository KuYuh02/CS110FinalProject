import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 font-bold text-xl text-indigo-600">
              SnapShare
            </Link>
          </div>
          
          <div className="flex items-center">
            <SearchBar />
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/upload" className="text-gray-700 hover:text-indigo-600">
                  Upload
                </Link>
                <Link to={`/profile/${user.id}`} className="text-gray-700 hover:text-indigo-600">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-indigo-600">
                  Login
                </Link>
                <Link to="/signup" className="text-gray-700 hover:text-indigo-600">
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