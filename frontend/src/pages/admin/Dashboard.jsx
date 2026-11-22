import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllProductsAdmin, deleteProduct } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import "./admin.css";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { admin, logout } = useAuth();

  function load() {
    setLoading(true);
    fetchAllProductsAdmin()
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Borrar "${name}"? Esta acción no se puede deshacer.`))
      return;
    await deleteProduct(id);
    load();
  }

  return (
    <div className="container admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1>Productos</h1>
          <p>Conectado como {admin?.username}</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link className="btn btn-accent" to="/admin/products/new">
            + New product
          </Link>
          <button className="btn btn-outline" onClick={logout}>
            Salir
          </button>
        </div>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td data-label="Image">
                  {p.images[0] && <img src={p.images[0].url} alt="" />}
                </td>
                <td data-label="Name">{p.name}</td>
                <td data-label="Brand">{p.brand}</td>
                <td data-label="Price">Bs {p.price.toFixed(2)}</td>
                <td data-label="Stock">{p.totalStock}</td>
                <td data-label="Status">
                  {p.isActive ? "Publicado" : "Borrador"}
                </td>
                <td data-label="Actions" className="admin-table__actions">
                  <Link
                    className="btn btn-outline"
                    to={`/admin/products/${p._id}`}
                  >
                    Editar
                  </Link>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleDelete(p._id, p.name)}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
