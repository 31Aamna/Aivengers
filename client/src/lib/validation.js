export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export function validateAuth(values, mode = 'login') {
  const errors = {}
  if (mode === 'signup' && !values.name?.trim()) errors.name = 'Tell us your name.'
  if (!isValidEmail(values.email || '')) errors.email = 'Enter a valid email address.'
  if ((values.password || '').length < 8) errors.password = 'Use at least 8 characters.'
  if (mode === 'signup' && values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords need to match.'
  return errors
}

export function validatePost(values, rawText = '') {
  const errors = {}
  if (rawText.trim().length < 12) errors.description = 'Add a little more context before publishing.'
  if (!values.title?.trim()) errors.title = 'Add a clear title.'
  if (!values.category) errors.category = 'Choose a category.'
  if (!values.location?.trim()) errors.location = 'Add a location.'
  if (!values.urgency) errors.urgency = 'Choose an urgency.'
  return errors
}
