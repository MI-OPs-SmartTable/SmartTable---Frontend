import AppRoutes from "./routes/AppRoutes";
import { useModalKeyboardSafe } from "./hooks/useModalKeyboardSafe";
import { TourProvider } from "./tours/TourProvider";
import "./styles/base.css";
import "./styles/modals-keyboard.css";
import "./styles/Tours.css";

function App() {
  useModalKeyboardSafe();
  return (
    <TourProvider>
      <AppRoutes />
    </TourProvider>
  );
}

export default App;
