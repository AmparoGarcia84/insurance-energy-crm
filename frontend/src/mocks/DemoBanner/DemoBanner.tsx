import './DemoBanner.css'

export default function DemoBanner() {
  return (
    <div className="demo-banner" role="status" aria-live="polite">
      <span className="demo-banner__badge">DEMO</span>
      <span className="demo-banner__text">
        Modo demostración — los cambios se reinician al recargar la página
      </span>
      <span className="demo-banner__credentials">
        Acceso:&nbsp;
        <code>mila@crm.com</code> / <code>owner1234</code>
        &ensp;·&ensp;
        <code>asesor@crm.com</code> / <code>employee1234</code>
      </span>
    </div>
  )
}
