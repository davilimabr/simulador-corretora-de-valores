/**
 * Valida o formato de um endereço de e-mail.
 * @param {string} email O e-mail a ser validado.
 * @returns {boolean} Retorna true se o e-mail for válido, caso contrário, false.
 */
export function isValidEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Verifica se uma senha é forte.
 * Requisitos:
 * - Mínimo de 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 * @param {string} password A senha a ser validada.
 * @returns {boolean} Retorna true se a senha for forte, caso contrário, false.
 */
export function isStrongPassword(password) {
  const re = /(?=^.{8,}$)((?=.*\d)|(?=.*[\W_]+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
  return re.test(password);
}
