import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({
  isLoggedIn,
  isAdmin,
  currentUser,
  onLogout,
  darkMode,
  toggleDarkMode,
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const baseLinks = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/diseases', label: 'Disease Guide', icon: '🔬' },
    { to: '/about', label: 'About', icon: 'ℹ️' },
  ]
  const adminLinks = isAdmin ? [{ to: '/manage-users', label: 'Manage Users', icon: '👥' }] : []
  const links = [...baseLinks, ...adminLinks]

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-700 to-eggplant-700 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                🍆
              </div>
              <span className="font-display font-bold text-lg text-forest-900 dark:text-white tracking-tight">
                TalongGuard
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(to)
                      ? 'bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-forest-700 hover:bg-forest-50 dark:hover:bg-forest-900/20 dark:hover:text-forest-400'
                  }`}
                >
                  {label}
                </Link>
              ))}

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {isLoggedIn ? (
                <div className="ml-2 flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white ${isAdmin ? 'bg-eggplant-600' : 'bg-forest-600'}`}
                    >
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                      {currentUser?.name?.split(' ')[0]}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] bg-eggplant-100 dark:bg-eggplant-900/40 text-eggplant-700 dark:text-eggplant-300 font-bold px-1.5 py-0.5 rounded-full">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onLogout}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 border border-gray-200 dark:border-gray-700 transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-forest-700 text-white hover:bg-forest-800 transition-all duration-200 shadow-sm"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span
                className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-300"
                style={{ transform: menuOpen ? 'rotate(45deg) translate(0, 8px)' : '' }}
              />
              <span
                className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-300"
                style={{ opacity: menuOpen ? 0 : 1 }}
              />
              <span
                className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-300"
                style={{ transform: menuOpen ? 'rotate(-45deg) translate(0, -8px)' : '' }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease forwards' }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            style={{ animation: 'slideInRight 0.28s cubic-bezier(0.32,0.72,0,1) forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* User info */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between h-16">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white ${isAdmin ? 'bg-gradient-to-br from-eggplant-600 to-eggplant-800' : 'bg-gradient-to-br from-forest-600 to-forest-800'}`}
                  >
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {currentUser?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isAdmin ? '⚙️ Administrator' : '🌾 Agriculturist'}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="font-display font-bold text-gray-900 dark:text-white">
                  TalongGuard
                </span>
              )}
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
              {links.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(to)
                      ? 'bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {label}
                  {isActive(to) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-forest-500" />
                  )}
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-5 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
              <button
                onClick={toggleDarkMode}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 transition"
              >
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              {isLoggedIn ? (
                <button
                  onClick={onLogout}
                  className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-800 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                >
                  👋 Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block w-full py-3 rounded-xl bg-forest-700 text-white text-sm font-semibold text-center hover:bg-forest-800 transition"
                >
                  🔐 Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
