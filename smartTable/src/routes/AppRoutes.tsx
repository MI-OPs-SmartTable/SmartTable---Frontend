import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "../pages/login"

const AppRoutes = () => {
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/Login" element={<Login />} />
             </Routes>
        </BrowserRouter>
    )    
}

export default AppRoutes