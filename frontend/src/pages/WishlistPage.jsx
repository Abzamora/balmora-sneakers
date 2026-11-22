import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProductBySlug } from "../api/api";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import "./Catalog.css"; // reutiliza la grilla del catálogo

export default function WishlistPage() {
  const { slugs } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Cada favorito se guarda solo como "slug" en localStorage; se pide el
    // detalle completo de cada uno para poder pintar la tarjeta.
    Promise.all(
      slugs.map((slug) => fetchProductBySlug(slug).catch(() => null)),
    ).then((results) => {
      setProducts(results.filter(Boolean));
      setLoading(false);
    });
  }, [slugs]);

  return (
    <div className="container catalog">
      <div className="catalog__header">
        <h1>Tus Favoritos</h1>
        <p>{loading ? "Cargando…" : `${products.length} guardados`}</p>
      </div>

      {!loading && products.length === 0 && (
        <p>
          No has guardado nada aún. Toca el ♡ en cualquier zapatilla para
          agregarla aqui — <Link to="/sneakers">explorar el catálogo</Link>.
        </p>
      )}

      <div className="catalog__grid">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
