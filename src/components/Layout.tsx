import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomDock from "./MobileBottomDock";

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
      <MobileBottomDock />
    </div>
  );
}
