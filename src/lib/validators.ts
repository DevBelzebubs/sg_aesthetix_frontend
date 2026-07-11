export function validateRequired(v: string, label: string): string | null {
  if (!v || !v.trim()) return `${label} es obligatorio`;
  return null;
}

export function validateEmail(v: string): string | null {
  if (!v) return "El correo es obligatorio";
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) return "Ingrese un correo electrónico válido";
  return null;
}

export function validateEmailOptional(v: string): string | null {
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) return "Ingrese un correo electrónico válido";
  return null;
}


export function validatePhone(v: string): string | null {
  if (!v) return "El teléfono es obligatorio";
  const cleaned = v.replace(/\s/g, "");
  if (!/^(\+?\d{1,3})?\d{7,9}$/.test(cleaned)) return "Ingrese un teléfono válido (ej: 999 999 999)";
  return null;
}

export function validatePhoneOptional(v: string): string | null {
  if (!v) return null;
  const cleaned = v.replace(/\s/g, "");
  if (!/^(\+?\d{1,3})?\d{7,9}$/.test(cleaned)) return "Ingrese un teléfono válido (ej: 999 999 999)";
  return null;
}

export function validateName(v: string, label = "El nombre"): string | null {
  if (!v || !v.trim()) return `${label} es obligatorio`;
  if (v.trim().length < 3) return `${label} debe tener al menos 3 caracteres`;
  if (/^\d+$/.test(v.trim())) return `${label} no puede ser solo números`;
  return null;
}

export function validatePassword(v: string): string | null {
  if (!v) return "La contraseña es obligatoria";
  if (v.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  return null;
}

export function validatePositiveNumber(v: number, label: string): string | null {
  if (v <= 0) return `${label} debe ser mayor a 0`;
  return null;
}

export function validateMinLength(v: string, min: number, label: string): string | null {
  if (!v || v.trim().length < min) return `${label} debe tener al menos ${min} caracteres`;
  return null;
}

export function validateUrl(v: string, label: string): string | null {
  if (!v) return null;
  if (!/^https?:\/\/[^\s]+$/.test(v.trim())) return `${label} debe ser una URL válida (https://...)`;
  return null;
}

export function validateDateOfBirth(v: string): string | null {
  if (!v) return null;
  const date = new Date(v);
  if (isNaN(date.getTime())) return "Ingrese una fecha válida";
  if (date > new Date()) return "La fecha de nacimiento no puede ser futura";
  const age = new Date().getFullYear() - date.getFullYear();
  if (age < 5) return "La edad mínima es 5 años";
  if (age > 120) return "La edad máxima es 120 años";
  return null;
}
