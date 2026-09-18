import { Link } from "react-router-dom";
import "./Breadcrumbs.css";

/**
 * items: [{ label, to }] — el último elemento se muestra sin link (página actual).
 */
export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label}>
            {isLast || !item.to ? (
              <span className="breadcrumbs__current" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link to={item.to}>{item.label}</Link>
            )}
            {!isLast && <span className="breadcrumbs__sep"> / </span>}
          </span>
        );
      })}
    </nav>
  );
}
