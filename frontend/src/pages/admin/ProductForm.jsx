import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchAllProductsAdmin,
  createProduct,
  updateProduct,
  uploadProductImages,
  deleteProductImage,
} from '../../api/api';
import './admin.css';

const BRANDS = ['Nike', 'Adidas', 'Jordan', 'New Balance', 'Puma', 'Reebok', 'Vans', 'Converse', 'Other'];
const STYLES = ['Running', 'Basketball', 'Lifestyle', 'Skate', 'Training', 'Retro', 'Boots'];
const ANGLES = ['front', 'side', 'back', 'top', 'sole', 'detail', 'lifestyle', 'box'];

const emptyProduct = {
  name: '',
  sku: '',
  brand: BRANDS[0],
  style: STYLES[0],
  description: '',
  price: '',
  compareAtPrice: '',
  colors: [''],
  variants: [{ size: '', stock: 0 }],
  isFeatured: false,
  isActive: true,
};

export default function ProductForm() {
  const { id } = useParams(); // "new" or a Mongo _id
  const isNew = id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyProduct);
  const [images, setImages] = useState([]); // existing images (from server) once product is saved
  const [pendingFiles, setPendingFiles] = useState([]); // File objects staged before the first save
  const [savedId, setSavedId] = useState(isNew ? null : id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    // The admin list endpoint already returns full documents; reuse it
    // rather than adding a dedicated GET /:id admin route.
    fetchAllProductsAdmin().then((all) => {
      const existing = all.find((p) => p._id === id);
      if (existing) {
        setForm({ ...existing, colors: existing.colors.length ? existing.colors : [''] });
        setImages(existing.images);
      }
    });
  }, [id, isNew]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateVariant(index, key, value) {
    const variants = [...form.variants];
    variants[index] = { ...variants[index], [key]: value };
    setForm((f) => ({ ...f, variants }));
  }

  function addVariantRow() {
    setForm((f) => ({ ...f, variants: [...f.variants, { size: '', stock: 0 }] }));
  }

  function updateColor(index, value) {
    const colors = [...form.colors];
    colors[index] = value;
    setForm((f) => ({ ...f, colors }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        colors: form.colors.filter(Boolean),
        variants: form.variants
          .filter((v) => v.size)
          .map((v) => ({ size: v.size, stock: Number(v.stock) || 0 })),
      };

      let productId = savedId;
      if (isNew && !savedId) {
        const created = await createProduct(payload);
        productId = created._id;
        setSavedId(productId);
      } else {
        await updateProduct(productId, payload);
      }

      // Flush any images staged before the product existed / since the last save
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((pf) => formData.append('images', pf.file));
        formData.append('angles', JSON.stringify(pendingFiles.map((pf) => pf.angle)));
        const updated = await uploadProductImages(productId, formData);
        setImages(updated.images);
        setPendingFiles([]);
      }

      navigate('/admin');
    } finally {
      setSaving(false);
    }
  }

  function stageFiles(fileList) {
    const files = Array.from(fileList).map((file) => ({ file, angle: 'front', preview: URL.createObjectURL(file) }));
    setPendingFiles((prev) => [...prev, ...files]);
  }

  async function handleRemoveExistingImage(publicId) {
    const updated = await deleteProductImage(savedId, publicId);
    setImages(updated.images);
  }

  return (
    <form className="container product-form" onSubmit={handleSubmit}>
      <h1>{isNew ? 'New sneaker' : 'Edit sneaker'}</h1>

      <label>
        Name
        <input value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
      </label>

      <div className="product-form__row">
        <label>
          SKU
          <input value={form.sku} onChange={(e) => updateField('sku', e.target.value)} required />
        </label>
        <label>
          Brand
          <select value={form.brand} onChange={(e) => updateField('brand', e.target.value)}>
            {BRANDS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>
      </div>

      <div className="product-form__row">
        <label>
          Style
          <select value={form.style} onChange={(e) => updateField('style', e.target.value)}>
            {STYLES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Price (BOB)
          <input type="number" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} required />
        </label>
      </div>

      <label>
        Compare-at price (optional, shows a "Sale" badge)
        <input type="number" step="0.01" value={form.compareAtPrice || ''} onChange={(e) => updateField('compareAtPrice', e.target.value)} />
      </label>

      <label>
        Description
        <textarea rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} required />
      </label>

      <fieldset>
        <legend>Colorways</legend>
        {form.colors.map((c, i) => (
          <input key={i} value={c} onChange={(e) => updateColor(i, e.target.value)} placeholder="e.g. Triple Black" />
        ))}
        <button type="button" className="btn btn-outline" onClick={() => setForm((f) => ({ ...f, colors: [...f.colors, ''] }))}>
          + Add colorway
        </button>
      </fieldset>

      <fieldset>
        <legend>Sizes & stock</legend>
        {form.variants.map((v, i) => (
          <div className="product-form__variant-row" key={i}>
            <input placeholder="Size, e.g. US 9" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} />
            <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} />
          </div>
        ))}
        <button type="button" className="btn btn-outline" onClick={addVariantRow}>
          + Add size
        </button>
      </fieldset>

      <fieldset>
        <legend>Images</legend>
        <input type="file" accept="image/*" multiple onChange={(e) => stageFiles(e.target.files)} />
        <div className="product-form__image-grid">
          {images.map((img) => (
            <div className="product-form__image-tile" key={img.publicId}>
              <img src={img.url} alt={img.angle} />
              <button type="button" className="product-form__image-remove" onClick={() => handleRemoveExistingImage(img.publicId)}>
                ×
              </button>
            </div>
          ))}
          {pendingFiles.map((pf, i) => (
            <div className="product-form__image-tile" key={pf.preview}>
              <img src={pf.preview} alt="pending upload" />
              <select
                value={pf.angle}
                onChange={(e) => {
                  const next = [...pendingFiles];
                  next[i] = { ...next[i], angle: e.target.value };
                  setPendingFiles(next);
                }}
                style={{ position: 'absolute', bottom: 0, width: '100%', fontSize: '0.6rem' }}
              >
                {ANGLES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          ))}
        </div>
        {isNew && !savedId && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Images upload once you save the product below.</p>}
      </fieldset>

      <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
        Published (visible in the public catalog)
      </label>

      <button className="btn btn-accent" type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save product'}
      </button>
    </form>
  );
}
