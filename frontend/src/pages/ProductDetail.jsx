import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { fetchProductBySlug, fetchProducts } from "../api/api";
import ImageGallery from "../components/ImageGallery";
import WhatsAppButton from "../components/WhatsAppButton";
import Breadcrumbs from "../components/Breadcrumbs";
import SizeGuide from "../components/SizeGuide";
import ProductCard from "../components/ProductCard";
import {
  recordRecentlyViewed,
  getRecentlyViewed,
} from "../utils/recentlyViewed";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    window.scrollTo(0, 0);

    fetchProductBySlug(slug)
      .then((data) => {
        setProduct(data);

        // Feature #9: remember this visit for the "recently viewed" rail
        recordRecentlyViewed(data);
        setRecentlyViewed(getRecentlyViewed(data.slug));

        // Feature #5: related products from the same brand, excluding this one
        fetchProducts({ brand: data.brand, limit: 5 }).then((res) => {
          setRelated(
            res.products.filter((p) => p.slug !== data.slug).slice(0, 4),
          );
        });
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound)
    return (
      <div className="container">
        <p>Zapatilla no encontrada.</p>
      </div>
    );
  if (!product)
    return (
      <div className="container">
        <p>Cargando…</p>
      </div>
    );

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];
  const productUrl = `${window.location.origin}/sneakers/${product.slug}`;
  const inStock = product.totalStock > 0;

  // Feature #10: Schema.org structured data so Google can show price/
  // availability directly in search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "USD",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container product-detail-page">
      {/* Feature #1: Open Graph + Twitter Card tags so sharing this link on
          WhatsApp/social shows the sneaker's photo, name and price.
          NOTE (see chat explanation): since this is a client-rendered SPA,
          crawlers that don't execute JS (WhatsApp's own preview bot included)
          may not see these tags. For guaranteed previews, a prerendering or
          SSR step is needed later — react-helmet-async still helps with the
          browser tab title/description and any crawler that does run JS. */}
      <Helmet>
        <title>{`${product.name} — Balmora Sneakers`}</title>
        <meta name="description" content={product.description.slice(0, 155)} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.name} />
        <meta
          property="og:description"
          content={product.description.slice(0, 155)}
        />
        <meta property="og:image" content={primaryImage.url} />
        <meta property="og:url" content={productUrl} />
        <meta property="product:price:amount" content={product.price} />
        <meta property="product:price:currency" content="USD" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Breadcrumbs
        items={[
          { label: "Catalog", to: "/sneakers" },
          {
            label: product.brand,
            to: `/sneakers?brand=${encodeURIComponent(product.brand)}`,
          },
          { label: product.name },
        ]}
      />

      <div className="product-detail">
        <ImageGallery images={product.images} />

        <div className="product-detail__info">
          <span className="tag">{product.brand}</span>
          <h1>{product.name}</h1>
          <p className="product-detail__price">Bs{product.price.toFixed(2)}</p>
          <p className="product-detail__description">{product.description}</p>

          <div className="product-detail__colors">
            <h4>Colorway</h4>
            <p>{product.colors.join(" / ")}</p>
          </div>

          <div className="product-detail__sizes">
            <div className="product-detail__sizes-header">
              <h4>Size (EUR)</h4>
              <SizeGuide />
            </div>
            <div className="product-detail__size-grid">
              {product.variants.map((v) => (
                <button
                  key={v.size}
                  disabled={v.stock === 0}
                  className={`filters__chip ${selectedSize === v.size ? "is-active" : ""}`}
                  onClick={() => setSelectedSize(v.size)}
                >
                  {v.size}
                </button>
              ))}
            </div>

            {/* Feature #2: stock/urgency indicator */}
            {inStock && product.totalStock <= 3 && (
              <p className="product-detail__urgency">
                Only {product.totalStock} left in stock
              </p>
            )}
            {!inStock && (
              <p className="product-detail__urgency product-detail__urgency--out">
                Out of stock
              </p>
            )}
          </div>

          {/* The two required, prominent WhatsApp CTAs — one to ask, one to buy */}
          <div className="product-detail__actions">
            <WhatsAppButton
              product={product}
              size={selectedSize}
              variant="inquire"
              label="Ask a question"
            />
            <WhatsAppButton
              product={product}
              size={selectedSize}
              variant="buy"
              label="Buy this pair"
            />
          </div>

          <p className="product-detail__sku">SKU: {product.sku}</p>
        </div>
      </div>

      {/* Feature #5: related products */}
      {related.length > 0 && (
        <section className="product-detail__section">
          <h2>You might also like</h2>
          <div className="product-detail__related-grid">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Feature #9: recently viewed */}
      {recentlyViewed.length > 0 && (
        <section className="product-detail__section">
          <h2>Recently viewed</h2>
          <div className="product-detail__recent-grid">
            {recentlyViewed.map((p) => (
              <a
                key={p.slug}
                href={`/sneakers/${p.slug}`}
                className="product-detail__recent-item"
              >
                <img src={p.image} alt={p.name} loading="lazy" />
                <span>{p.name}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Feature #3: sticky WhatsApp bar on mobile, always visible while scrolling */}
      <div className="product-detail__sticky-bar">
        <WhatsAppButton
          product={product}
          size={selectedSize}
          variant="buy"
          label="Buy via WhatsApp"
        />
      </div>
    </div>
  );
}
