import { useState } from "react"
import { login } from "../services/authService"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import "../styles/login.css"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)  
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("Completa los campos"); return }
    const success = await login(email, password)
    if (success) { navigate("/pos") } else { setError("Credenciales incorrectas") }
  }

  return (
    <div className="login-container">
      <div className="login-avatar">
        <svg viewBox="0 0 24 24">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      </div>
      <div className="login-panel">
        <h1 className="login-title">Iniciar Sesión</h1>
        <p className="login-sub">Ingresa tus credenciales para continuar</p>
        <form onSubmit={handleSubmit} className="login-form">

          <label className="login-label-outside">Correo electrónico</label>
          <div className="login-field">
            <input
              className="login-input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
    
          <label className="login-label-outside">Contraseña</label>
          <div className="login-field password-field">
            <input
              className="login-input"
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
          </div>
          
          {error && <p className="login-error">{error}</p>}
          <div className="login-divider" />
          <button className="login-button" type="submit">Ingresar el Sistema</button>
        </form>
      </div>
    </div>
  )
}

export default Login