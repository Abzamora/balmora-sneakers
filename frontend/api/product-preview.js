/**
 * Vercel Serverless Function — sirve una página HTML mínima con las
 * etiquetas Open Graph correctas para robots que NO ejecutan JavaScript
 * (WhatsApp, Facebook, Twitter/X, LinkedIn, Telegram, Discord...).
 *
 * vercel.json redirige aquí SOLO cuando el "user-agent" de la solicitud
 * coincide con uno de esos robots; un usuario real jamás llega a este
 * archivo, sigue viendo la SPA de React normalmente.
 */
export default async function handler(req, res) {
  const { slug } = req.query;
  const apiUrl = process.env.API_URL; // ej: https://sneaker-store-api.onrender.com/api

  try {
    const response = await fetch(`${apiUrl}/products/${slug}`);
    if (!response.ok) throw new Error('Product not found');
    const product = await response.json();

    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
    const productUrl = `https://${req.headers.host}/sneakers/${product.slug}`;
    const description = escapeHtml(product.description.slice(0, 155));
    const name = escapeHtml(product.name);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>${name} — Balmora Sneakers</title>
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${name}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${primaryImage.url}" />
    <meta property="og:url" content="${productUrl}" />
    <meta property="product:price:amount" content="${product.price}" />
    <meta property="product:price:currency" content="USD" />
    <meta name="twitter:card" content="summary_large_image" />
    <!-- Si un humano llega a abrir esta URL directamente, lo mandamos a la app real -->
    <meta http-equiv="refresh" content="0;url=${productUrl}" />
  </head>
  <body>
    <p>Redirigiendo a <a href="${productUrl}">${name}</a>...</p>
  </body>
</html>`);
  } catch (err) {
    res.status(404).send('Product not found');
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
