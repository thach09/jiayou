/** BCrypt validates UTF-8 bytes independently of the form's character limit. */
export function passwordLengthError(...passwords: string[]): string | null {
  return passwords.some(value => new TextEncoder().encode(value).length > 72)
    ? 'Mật khẩu quá dài khi dùng ký tự Unicode. Vui lòng rút ngắn.'
    : null;
}
