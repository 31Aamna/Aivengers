export default function Button({ children, variant = 'primary', small = false, wide = false, type = 'button', disabled = false, onClick, className = '', ...props }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`button button--${variant} ${small ? 'button--small' : ''} ${wide ? 'button--wide' : ''} ${className}`} {...props}>{children}</button>
}
