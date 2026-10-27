export function isSoldOut(product) {
  if (product.isSold) return true;
  return product.variants.length > 0 && product.totalStock === 0;
}
