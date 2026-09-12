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
function buildWhatsAppLink({ name, sku, size, variant, url }) {
  const messages = {
    inquire: `¡Hola! Me gustaría más información sobre el ${name} (SKU: ${sku}). ¿Está disponible?\n${url}`,
    buy: `¡Hola! Quiero comprar el ${name} (SKU: ${sku})${size ? `, talla ${size}` : ""}. ¿Cómo puedo completar la compra?\n${url}`,
  };
  const text = encodeURIComponent(messages[variant] || messages.inquire);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function WhatsAppButton({
  product,
  size,
  variant = "inquire",
  label,
}) {
  const productUrl = `${window.location.origin}/sneakers/${product.slug}`;
  const href = buildWhatsAppLink({
    name: product.name,
    sku: product.sku,
    size,
    variant,
    url: productUrl,
  });

  return (
    <a
      className="btn btn-whatsapp"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()} // don't also trigger a parent card's onClick
      aria-label={`Contact via WhatsApp about ${product.name}`}
    >
      {label || (variant === "buy" ? "Buy via WhatsApp" : "Ask on WhatsApp")}
    </a>
  );
}
