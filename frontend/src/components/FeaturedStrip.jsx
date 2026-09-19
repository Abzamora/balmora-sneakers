import { useEffect, useState } from "react";
import { fetchProducts } from "../api/api";
import ProductCard from "./ProductCard";
import "./FeaturedStrip.css";

/**
 * Muestra los productos marcados como "Featured" desde el admin.
 * Si ningún producto está marcado, el componente no renderiza nada —
 * es 100% opcional y queda a criterio del admin, como se pidió.
 */
export default function FeaturedStrip() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetchProducts({ featured: "true", limit: 8 }).then((res) =>
      setFeatured(res.products),
    );
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="featured-strip">
      <h2 className="featured-strip__title">Featured this week</h2>
      <div className="featured-strip__scroll">
        {featured.map((p) => (
          <div className="featured-strip__item" key={p._id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
