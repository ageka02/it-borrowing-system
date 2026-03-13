import Navbar from './Navbar';

export default function Layout({ children, isAdmin = false }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAdmin={isAdmin} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
