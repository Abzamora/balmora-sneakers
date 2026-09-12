const mongoose = require("mongoose");

/**
 * A single product photo. "angle" lets the frontend group and order the
 * gallery (front, side, back, top, sole, detail, lifestyle...).
 */
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary public_id, needed to delete on removal
    angle: {
      type: String,
      enum: [
        "front",
        "side",
        "back",
        "top",
        "sole",
        "detail",
        "lifestyle",
        "box",
      ],
      default: "front",
    },
    isPrimary: { type: Boolean, default: false }, // shown on catalog cards
  },
  { _id: false },
);

/**
 * One purchasable size/stock combination. Modeled as a sub-array so a
 * single sneaker model (e.g. "Air Max 90") can track availability per size.
 */
const variantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true }, // e.g. "US 9", "EU 42"
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    sku: { type: String, required: true, unique: true }, // shown in the WhatsApp message
    brand: {
      type: String,
      required: true,
      enum: [
        "Nike",
        "Adidas",
        "Jordan",
        "New Balance",
        "Puma",
        "Reebok",
        "Vans",
        "Converse",
        "Other",
      ],
      index: true,
    },
    style: {
      type: String,
      required: true,
      enum: [
        "Running",
        "Basketball",
        "Lifestyle",
        "Skate",
        "Training",
        "Retro",
        "Boots",
      ],
      index: true,
    },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0, index: true },
    compareAtPrice: { type: Number, min: 0 }, // original price, for "on sale" badges
    colors: [{ type: String, required: true }], // ["Black/White", "Triple Black"]
    variants: { type: [variantSchema], default: [] },
    images: {
      type: [imageSchema],
      default: [],
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true }, // soft delete / draft toggle
    totalStock: { type: Number, default: 0 }, // denormalized sum of variants.stock, kept in sync via pre-save hook
  },
  { timestamps: true },
);

// Full-text search across name, brand and description for the search bar
productSchema.index({ name: "text", description: "text" });

// Keep totalStock accurate without requiring the client to compute it
productSchema.pre("save", function (next) {
  this.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  next();
});

module.exports = mongoose.model("Product", productSchema);
