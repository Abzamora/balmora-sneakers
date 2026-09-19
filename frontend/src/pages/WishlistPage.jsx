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
        <h1>Your Favorites</h1>
        <p>{loading ? "Loading…" : `${products.length} saved`}</p>
      </div>

      {!loading && products.length === 0 && (
        <p>
          You haven't saved anything yet. Tap the ♡ on any sneaker to add it
          here — <Link to="/sneakers">browse the catalog</Link>.
        </p>
      )}

      <div
        className="catalog__grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}
      >
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
