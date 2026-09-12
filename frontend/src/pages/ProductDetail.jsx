import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProductBySlug } from "../api/api";
import ImageGallery from "../components/ImageGallery";
import WhatsAppButton from "../components/WhatsAppButton";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    fetchProductBySlug(slug)
      .then(setProduct)
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

  return (
    <div className="container product-detail">
      <ImageGallery images={product.images} />

      <div className="product-detail__info">
        <span className="tag">{product.brand}</span>
        <h1>{product.name}</h1>
        <p className="product-detail__price">${product.price.toFixed(2)}</p>
        <p className="product-detail__description">{product.description}</p>

        <div className="product-detail__colors">
          <h4>Colores</h4>
          <p>{product.colors.join(" / ")}</p>
        </div>

        <div className="product-detail__sizes">
          <h4>Talla (EUR)</h4>
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
        </div>

        {/* The two required, prominent WhatsApp CTAs — one to ask, one to buy */}
        <div className="product-detail__actions">
          <WhatsAppButton
            product={product}
            size={selectedSize}
            variant="inquire"
            label="Hacer una pregunta"
          />
          <WhatsAppButton
            product={product}
            size={selectedSize}
            variant="buy"
            label="Comprar esta par"
          />
        </div>

        <p className="product-detail__sku">SKU: {product.sku}</p>
      </div>
    </div>
  );
}
