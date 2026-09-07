import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ProductForm from './pages/admin/ProductForm';
import ProtectedRoute from './pages/admin/ProtectedRoute';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public storefront */}
        <Route path="/" element={<Catalog />} />
        <Route path="/sneakers" element={<Catalog />} />
        <Route path="/sneakers/:slug" element={<ProductDetail />} />

        {/* Admin panel, guarded except for the login screen itself */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id"
          element={
            <ProtectedRoute>
              <ProductForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
