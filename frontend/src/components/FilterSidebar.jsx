import "./FilterSidebar.css";

/**
 * Controlled, presentation-only filter panel. All state lives in the parent
 * (Catalog.jsx) so filters can be reflected in the URL query string and
 * shared/bookmarked. Every change fires immediately — no "Apply" button —
 * per the "real-time filtering" requirement.
 */
export default function FilterSidebar({ facets, filters, onChange }) {
  if (!facets) return null;

  function toggleMulti(key, value) {
    const current = filters[key] ? filters[key].split(",") : [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next.join(",") });
  }

  return (
    <aside className="filters" aria-label="Product filters">
      <FilterGroup title="Brand">
        {facets.brands.map((brand) => (
          <label key={brand} className="filters__option">
            <input
              type="checkbox"
              checked={filters.brand?.split(",").includes(brand) || false}
              onChange={() => toggleMulti("brand", brand)}
            />
            {brand}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Style">
        {facets.styles.map((style) => (
          <label key={style} className="filters__option">
            <input
              type="checkbox"
              checked={filters.style?.split(",").includes(style) || false}
              onChange={() => toggleMulti("style", style)}
            />
            {style}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Talla (EUR)">
        <div className="filters__chip-grid">
          {facets.sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={`filters__chip ${filters.size?.split(",").includes(size) ? "is-active" : ""}`}
              onClick={() => toggleMulti("size", size)}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Color">
        {facets.colors.map((color) => (
          <label key={color} className="filters__option">
            <input
              type="checkbox"
              checked={filters.color?.split(",").includes(color) || false}
              onChange={() => toggleMulti("color", color)}
            />
            {color}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="filters__price-row">
          <input
            type="number"
            placeholder={`$${facets.priceRange.min}`}
            value={filters.minPrice || ""}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
          />
          <span>–</span>
          <input
            type="number"
            placeholder={`$${facets.priceRange.max}`}
            value={filters.maxPrice || ""}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </FilterGroup>

      <button
        type="button"
        className="btn btn-outline"
        onClick={() => onChange({})}
      >
        Borrar filtros
      </button>
    </aside>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="filters__group">
      <h4 className="filters__title">{title}</h4>
      {children}
    </div>
  );
}
