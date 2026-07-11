import AppRoutes from "./routes/AppRoutes";
import { useModalKeyboardSafe } from "./hooks/useModalKeyboardSafe";
import "./styles/modals-keyboard.css";

function App() {
  useModalKeyboardSafe();
  return <AppRoutes />;
}

export default App;
