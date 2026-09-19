const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const {
  cloudinary,
  uploadBufferToCloudinary,
} = require("../config/cloudinary");

/**
 * Turns a sneaker name into a URL-safe, unique-ish slug.
 * e.g. "Air Jordan 1 Retro High" -> "air-jordan-1-retro-high"
 */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * GET /api/products
 * Public. Powers the catalog page's real-time filters.
 * Supported query params:
 *   brand, style, color, size        -> exact-match filters (comma separated for multi-select)
 *   minPrice, maxPrice               -> price range
 *   q                                -> free-text search (name/description)
 *   sort                             -> "price_asc" | "price_desc" | "newest" (default)
 *   page, limit                      -> pagination
 */
const getProducts = asyncHandler(async (req, res) => {
  const { brand, style, color, size, minPrice, maxPrice, q, sort, featured } =
    req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 60);

  const filter = { isActive: true };

  if (brand) filter.brand = { $in: brand.split(",") };
  if (style) filter.style = { $in: style.split(",") };
  if (color) filter.colors = { $in: color.split(",") };
  if (size) filter["variants.size"] = { $in: size.split(",") };
  if (featured === "true") filter.isFeatured = true; // powers the "featured" strip — fully optional per admin

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (q) filter.$text = { $search: q };

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
  };
  const sortOption = sortMap[sort] || sortMap.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    page,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  });
});

/**
 * GET /api/products/facets
 * Public. Returns the distinct brand/style/color/size values currently in
 * stock, so the filter sidebar never shows an option with zero results.
 */
const getFacets = asyncHandler(async (req, res) => {
  const [brands, styles, colors, sizes, priceBounds] = await Promise.all([
    Product.distinct("brand", { isActive: true }),
    Product.distinct("style", { isActive: true }),
    Product.distinct("colors", { isActive: true }),
    Product.distinct("variants.size", { isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } },
      },
    ]),
  ]);

  res.json({
    brands,
    styles,
    colors,
    sizes: sizes.sort(),
    priceRange: priceBounds[0] || { min: 0, max: 0 },
  });
});

/**
 * GET /api/products/:slug
 * Public. Product detail page — full data including every gallery image.
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

/**
 * GET /api/products/admin/all
 * Protected. Admin dashboard list — includes inactive/draft products too.
 */
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.json(products);
});

/**
 * POST /api/products
 * Protected. Creates a product. Images are uploaded separately via
 * POST /api/products/:id/images (see below) so large uploads don't block
 * the metadata form on mobile connections.
 */
const createProduct = asyncHandler(async (req, res) => {
  const body = req.body;
  const slug = slugify(`${body.name}-${body.sku}`);

  const product = await Product.create({
    ...body,
    slug,
    images: [], // added afterwards through the upload endpoint
  });

  res.status(201).json(product);
});

/**
 * PUT /api/products/:id
 * Protected. Updates any editable field. Re-slugifies if the name changed.
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  Object.assign(product, req.body);
  if (req.body.name || req.body.sku) {
    product.slug = slugify(
      `${req.body.name || product.name}-${req.body.sku || product.sku}`,
    );
  }

  const updated = await product.save();
  res.json(updated);
});

/**
 * DELETE /api/products/:id
 * Protected. Removes the product and cleans up its Cloudinary images so
 * the free-tier storage quota doesn't fill up with orphaned files.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await Promise.all(
    product.images.map((img) => cloudinary.uploader.destroy(img.publicId)),
  );
  await product.deleteOne();

  res.json({ message: "Product deleted" });
});

/**
 * POST /api/products/:id/images
 * Protected. Accepts multiple files (field name "images", see routes) via
 * multer + Cloudinary storage, and appends them to the product's gallery.
 * Body can include a matching "angles" array (JSON string) to tag each
 * upload, e.g. ["front","side","sole"].
 */
const addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No image files were uploaded");
  }

  const angles = req.body.angles ? JSON.parse(req.body.angles) : [];

  const results = await Promise.all(
    req.files.map((file) => uploadBufferToCloudinary(file.buffer)),
  );

  const newImages = results.map((result, i) => ({
    url: result.secure_url,
    publicId: result.public_id,
    angle: angles[i] || "front",
    isPrimary: product.images.length === 0 && i === 0,
  }));

  product.images.push(...newImages);
  await product.save();

  res.status(201).json(product);
});

/**
 * DELETE /api/products/:id/images/:publicId
 * Protected. Removes a single gallery image, both from Cloudinary and from
 * the product document. publicId arrives URL-encoded because Cloudinary
 * ids contain slashes (folder paths).
 */
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const publicId = decodeURIComponent(req.params.publicId);
  await cloudinary.uploader.destroy(publicId);

  product.images = product.images.filter((img) => img.publicId !== publicId);
  await product.save();

  res.json(product);
});

module.exports = {
  getProducts,
  getFacets,
  getProductBySlug,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
};
