import { Link } from "react-router-dom";
import FeaturedStrip from "../components/FeaturedStrip";
import "./Home.css";

export default function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <div className="container home__hero-inner">
          <h1 className="home__hero-title">Balmora Sneakers</h1>
          <p className="home__hero-subtitle">
            Pares seleccionados, directo a tu WhatsApp.
          </p>
          <Link to="/sneakers" className="btn btn-accent home__hero-cta">
            Explorar el catálogo completo
          </Link>
        </div>
      </section>

      <div className="container home__featured-section">
        <FeaturedStrip />
      </div>
    </div>
  );
}
