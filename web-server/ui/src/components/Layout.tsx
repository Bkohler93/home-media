import { NavLink } from "react-router-dom";

export const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className='flex h-screen'>
  
      {/* navigation menu */}
      <div className="w-48 bg-gray-800 text-white p-4">
        <h3 className="text-lg font-bold mb-4">Categories</h3>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `block mb-2 px-2 py-1 rounded ${
              isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
            }`
          }
        >
          Movies
        </NavLink>
        <NavLink
          to="/tv-shows"
          className={({ isActive }) =>
            `block mb-2 px-2 py-1 rounded ${
              isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
            }`
          }
        >
          TV Shows
        </NavLink>
        <NavLink
        to="/upload"
        className={({ isActive }) =>
          `block mb-2 px-2 py-1 rounded ${
            isActive ? 'bg-blue-600 text-white':'hover:bg-gray-700'
          }`
        } 
        >
          Upload
        </NavLink>
      </div><div>
  
      </div>
  
      {/* main content */}
      <div className='flex-1 p-6'>{children}</div>
    </div>
  );