const express = require('express');
const {
  getProducts,
  getFacets,
  getProductBySlug,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// ---- Public catalog routes -------------------------------------------------
router.get('/', getProducts);
router.get('/facets', getFacets);

// ---- Protected admin routes (declared before ":slug" to avoid shadowing) --
router.get('/admin/all', protect, getAllProductsAdmin);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/images', protect, upload.array('images', 10), addProductImages);
router.delete('/:id/images/:publicId', protect, deleteProductImage);

// ---- Public product detail (kept last: ":slug" is a catch-all string) -----
router.get('/:slug', getProductBySlug);

module.exports = router;
