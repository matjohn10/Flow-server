export const genId5 = (): string => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let passwordLength = 5;
  let password = "";
  while (passwordLength > 0) {
    const index = Math.floor(Math.random() * chars.length);
    password += chars.substring(index, index + 1);
    passwordLength--;
  }

  return password;
};
