const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

/**
 * Builds a wa.me deep link with a pre-filled, URL-encoded message that
 * names the exact sneaker and its SKU, so whoever answers on WhatsApp
 * instantly knows what the customer is asking about — no back-and-forth.
 *
 * variant: "inquire" (catalog card, casual question) or "buy" (detail page,
 * ready-to-purchase intent). Two distinct messages per the spec's request
 * for two differently-worded CTAs.
 */
function buildWhatsAppLink({ name, sku, size, variant }) {
  const messages = {
    inquire: `Hi! I'd like more information about the ${name} (SKU: ${sku}). Is it available?`,
    buy: `Hi! I want to buy the ${name} (SKU: ${sku})${size ? `, size ${size}` : ''}. How can I complete the purchase?`,
  };
  const text = encodeURIComponent(messages[variant] || messages.inquire);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function WhatsAppButton({ product, size, variant = 'inquire', label }) {
  const href = buildWhatsAppLink({ name: product.name, sku: product.sku, size, variant });

  return (
    <a
      className="btn btn-whatsapp"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()} // don't also trigger a parent card's onClick
      aria-label={`Contact via WhatsApp about ${product.name}`}
    >
      {label || (variant === 'buy' ? 'Buy via WhatsApp' : 'Ask on WhatsApp')}
    </a>
  );
}
