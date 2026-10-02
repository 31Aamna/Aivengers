export default function Input({ label, error, icon, id, ...props }) {
  return <div className={`field ${error ? 'has-error' : ''}`}><label htmlFor={id}>{label}</label><div className="input-with-icon">{icon}{<input id={id} {...props} />}</div>{error && <span className="field-error">{error}</span>}</div>
}
