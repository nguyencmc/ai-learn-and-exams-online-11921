import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
