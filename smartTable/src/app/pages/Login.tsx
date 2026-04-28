import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp, ROLE_LABELS } from "../context/AppContext";
import { ChefHat, Eye, EyeOff, Lock, User } from "lucide-react";

export default function Login() {
  const { users, login } = useApp();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = users.find(u => u.id === selectedUser && u.active);
    if (!user) { setError("Selecciona un usuario válido"); return; }
    if (user.pin !== pin) { setError("PIN incorrecto"); setPin(""); return; }
    login(selectedUser);
    navigate("/");
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");
      if (newPin.length === 4) {
        const user = users.find(u => u.id === selectedUser && u.active);
        if (user && user.pin === newPin) {
          login(selectedUser);
          navigate("/");
        } else if (user) {
          setTimeout(() => { setError("PIN incorrecto"); setPin(""); }, 300);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-2xl mb-4 shadow-lg">
            <ChefHat className="text-white" size={40} />
          </div>
          <h1 className="text-white text-3xl">Smartable</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de Punto de Venta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-slate-800 text-xl mb-6 text-center">Iniciar Sesión</h2>

          {/* User selection */}
          <div className="mb-5">
            <label className="text-sm text-slate-600 mb-2 block">Seleccionar Usuario</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedUser}
                onChange={e => { setSelectedUser(e.target.value); setPin(""); setError(""); }}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">-- Elige tu perfil --</option>
                {users.filter(u => u.active).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>
                ))}
              </select>
            </div>
          </div>

          {/* PIN Input */}
          <div className="mb-5">
            <label className="text-sm text-slate-600 mb-2 block">PIN de Acceso</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={e => { setPin(e.target.value.slice(0, 4)); setError(""); }}
                placeholder="••••"
                maxLength={4}
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* PIN Pad */}
          {selectedUser && (
            <div className="mb-5">
              <div className="flex justify-center gap-2 mb-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? "bg-orange-500 border-orange-500" : "border-slate-300"}`} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["1","2","3","4","5","6","7","8","9","←","0","✓"].map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "←") setPin(p => p.slice(0, -1));
                      else if (key === "✓") handleLogin();
                      else handlePinDigit(key);
                    }}
                    className={`py-3 rounded-xl text-lg transition-all ${
                      key === "✓" ? "bg-orange-500 text-white hover:bg-orange-600" :
                      key === "←" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" :
                      "bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-600 border border-slate-200"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4 text-center">{error}</div>
          )}

          <button
            onClick={handleLogin}
            disabled={!selectedUser || pin.length < 4}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 rounded-xl transition-all"
          >
            Ingresar al Sistema
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            Demo: Admin PIN 1234 · Cajero PIN 2222
          </p>
        </div>
      </div>
    </div>
  );
}
