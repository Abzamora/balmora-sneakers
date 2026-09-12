import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts, fetchFacets } from "../api/api";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import "./Catalog.css";

/**
 * The filter state IS the URL query string, so filtered views are
 * shareable/bookmarkable and survive a page refresh. Every filter change
 * re-fetches immediately (debounced on price inputs) — this is the
 * "real-time filtering" the spec asks for, without a client-side cache
 * layer that would go stale against admin edits.
 */
export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(searchParams.entries());

  const [facets, setFacets] = useState(null);
  const [data, setData] = useState({
    products: [],
    totalPages: 1,
    totalResults: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchFacets().then(setFacets);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchProducts(filters)
      .then(setData)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    // Debounce so typing in the price fields doesn't fire a request per keystroke
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  function handleFilterChange(next) {
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== "" && v != null),
    );
    setSearchParams(cleaned);
  }

  return (
    <div className="container catalog">
      <div className="catalog__header">
        <h1>Balmora - Sneakers</h1>
        <p>
          {loading ? "Loading…" : `${data.totalResults} zapatillas encontradas`}
        </p>
        <button
          className="btn btn-outline catalog__filter-toggle"
          onClick={() => setMobileFiltersOpen(true)}
        >
          Filtros
        </button>
      </div>

      <div className="catalog__layout">
        <div
          className={`catalog__sidebar ${mobileFiltersOpen ? "is-open" : ""}`}
        >
          <div className="catalog__sidebar-header">
            <span>Filtros</span>
            <button
              className="btn btn-outline"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Cerrar
            </button>
          </div>
          <FilterSidebar
            facets={facets}
            filters={filters}
            onChange={handleFilterChange}
          />
        </div>

        <div className="catalog__grid">
          {!loading && data.products.length === 0 && (
            <p>No se encontraron zapatillas que coincidan con esos filtros.</p>
          )}
          {data.products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
