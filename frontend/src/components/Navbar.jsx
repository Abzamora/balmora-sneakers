import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWishlist } from "../context/WishlistContext";
import "./Navbar.css";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { slugs } = useWishlist();

  function handleSubmit(e) {
    e.preventDefault();
    navigate(`/sneakers?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo display">
          BALMORA
        </Link>
        <form className="navbar__search" onSubmit={handleSubmit} role="search">
          <input
            type="search"
            placeholder="Search sneakers, brands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search sneakers"
          />
        </form>
        <nav className="navbar__links">
          <Link to="/sneakers">Catálogo</Link>
          <Link to="/favoritos">{`♥ Favorites${slugs.length > 0 ? ` (${slugs.length})` : ""}`}</Link>
        </nav>
      </div>
    </header>
  );
}
