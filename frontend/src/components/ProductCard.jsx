import { Link } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <article className="product-card">
      <Link to={`/sneakers/${product.slug}`} className="product-card__media">
        <img src={primaryImage.url} alt={product.name} loading="lazy" />
        {onSale && <span className="product-card__badge">Sale</span>}
      </Link>

      <div className="product-card__body">
        <span className="product-card__brand">{product.brand}</span>
        <Link to={`/sneakers/${product.slug}`}>
          <h3 className="product-card__name">{product.name}</h3>
        </Link>

        <div className="product-card__price-row">
          <span className="product-card__price">${product.price.toFixed(2)}</span>
          {onSale && <span className="product-card__compare">${product.compareAtPrice.toFixed(2)}</span>}
        </div>

        <WhatsAppButton product={product} variant="inquire" />
      </div>
    </article>
  );
}
