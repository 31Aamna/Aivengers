import { CircleAlert } from 'lucide-react'
import Button from './Button.jsx'
export default function ErrorMessage({ title = 'Something went wrong.', message = 'Please try again.', onRetry }) { return <div className="inline-error"><div className="inline-error__icon"><CircleAlert size={22} /></div><div><strong>{title}</strong><p>{message}</p></div>{onRetry && <Button variant="secondary" small onClick={onRetry}>Try again</Button>}</div> }
