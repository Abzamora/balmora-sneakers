import { createContext, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'wishlist_slugs';

/**
 * Lista de favoritos guardada solo en el navegador del cliente
 * (localStorage) — no requiere cuenta ni backend, suficiente para que un
 * comprador compare zapatillas antes de decidir.
 */
export function WishlistProvider({ children }) {
  const [slugs, setSlugs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  }, [slugs]);

  function toggle(slug) {
    setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function isSaved(slug) {
    return slugs.includes(slug);
  }

  return (
    <WishlistContext.Provider value={{ slugs, toggle, isSaved }}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
