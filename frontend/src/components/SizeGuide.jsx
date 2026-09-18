import { useState } from 'react';
import './SizeGuide.css';

// Equivalencias aproximadas US -> EU -> CM para calzado unisex/adulto.
// Ajusta esta tabla si vendes tallas de niño o marcas con tallaje distinto.
const SIZE_TABLE = [
  { us: '6', eu: '38.5', cm: '24' },
  { us: '6.5', eu: '39', cm: '24.5' },
  { us: '7', eu: '40', cm: '25' },
  { us: '7.5', eu: '40.5', cm: '25.5' },
  { us: '8', eu: '41', cm: '26' },
  { us: '8.5', eu: '42', cm: '26.5' },
  { us: '9', eu: '42.5', cm: '27' },
  { us: '9.5', eu: '43', cm: '27.5' },
  { us: '10', eu: '44', cm: '28' },
  { us: '10.5', eu: '44.5', cm: '28.5' },
  { us: '11', eu: '45', cm: '29' },
  { us: '12', eu: '46', cm: '30' },
];

export default function SizeGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="size-guide__trigger" onClick={() => setOpen(true)}>
        Guía de tallas
      </button>

      {open && (
        <div className="size-guide__overlay" onClick={() => setOpen(false)}>
          <div className="size-guide__modal" onClick={(e) => e.stopPropagation()}>
            <div className="size-guide__header">
              <h3>Guía de tallas</h3>
              <button className="btn btn-outline" onClick={() => setOpen(false)}>Cerrar</button>
            </div>
            <table className="size-guide__table">
              <thead>
                <tr><th>US</th><th>EU</th><th>CM</th></tr>
              </thead>
              <tbody>
                {SIZE_TABLE.map((row) => (
                  <tr key={row.us}>
                    <td>{row.us}</td>
                    <td>{row.eu}</td>
                    <td>{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="size-guide__note">
              Mide la longitud de tu pie en cm y compara con la columna CM para el ajuste más preciso.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
