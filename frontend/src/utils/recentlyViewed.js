const STORAGE_KEY = 'recently_viewed';
const MAX_ITEMS = 8;

/**
 * Guarda los últimos productos vistos (solo la info mínima para pintar una
 * tarjeta, no el objeto completo) en localStorage. No usa React Context
 * porque solo se escribe desde ProductDetail y se lee desde ese mismo lugar
 * o desde el catálogo — un módulo simple es suficiente.
 */
export function recordRecentlyViewed(product) {
  const entry = {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: (product.images.find((i) => i.isPrimary) || product.images[0])?.url,
  };

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    list = [];
  }

  list = [entry, ...list.filter((p) => p.slug !== entry.slug)].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getRecentlyViewed(excludeSlug) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return list.filter((p) => p.slug !== excludeSlug);
  } catch {
    return [];
  }
}
