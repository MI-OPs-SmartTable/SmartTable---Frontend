export const login = async (email: string, password: string) => {
  
  if (email === "admin@test.com" && password === "1234") {
    return true
  }

  return false
}