import { useState } from "react";
import "./ShareButton.css";

export default function ShareButton({ product, variant = "full" }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/sneakers/${product.slug}`;

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} — Balmora Sneakers`,
          url,
        });
      } catch {
        // el usuario canceló, no hacemos nada
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", url);
    }
  }

  return (
    <button
      type="button"
      className={`share-btn share-btn--${variant}`}
      onClick={handleShare}
      aria-label={`Compartir ${product.name}`}
    >
      {variant === "icon"
        ? copied
          ? "✓"
          : "↗"
        : copied
          ? "¡Enlace copiado!"
          : "Compartir"}
    </button>
  );
}
