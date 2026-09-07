import { useRef, useState } from 'react';
import './ImageGallery.css';

/**
 * Main image + thumbnail rail, with a magnifying hover-zoom on desktop
 * (cursor-follow background-position) and native pinch-zoom-friendly
 * swipe on touch devices (the browser's own image zoom still works since
 * we never intercept touch gestures on the <img> itself).
 */
export default function ImageGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({});
  const frameRef = useRef(null);
  const active = images[activeIndex];

  function handleMouseMove(e) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({
      backgroundImage: `url(${active.url})`,
      backgroundPosition: `${x}% ${y}%`,
      opacity: 1,
    });
  }

  return (
    <div className="gallery">
      <div
        className="gallery__frame"
        ref={frameRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomStyle((s) => ({ ...s, opacity: 0 }))}
      >
        <img src={active.url} alt={`${active.angle} view`} />
        {/* Zoom layer: same image, magnified, revealed only under the cursor via CSS mask-free crop trick */}
        <div className="gallery__zoom-layer" style={{ ...zoomStyle, backgroundSize: '220%' }} />
      </div>

      <div className="gallery__thumbs" role="tablist" aria-label="Product angles">
        {images.map((img, i) => (
          <button
            key={img.publicId}
            role="tab"
            aria-selected={i === activeIndex}
            className={`gallery__thumb ${i === activeIndex ? 'is-active' : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            <img src={img.url} alt={`${img.angle} thumbnail`} />
            <span className="gallery__thumb-label">{img.angle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
