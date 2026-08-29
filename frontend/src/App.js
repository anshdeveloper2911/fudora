import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LocationProvider } from "@/context/LocationContext";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import CustomerLayout from "@/components/CustomerLayout";
import AdminLayout from "@/components/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Restaurants from "@/pages/Restaurants";
import Search from "@/pages/Search";
import RestaurantDetail from "@/pages/RestaurantDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderTracking from "@/pages/OrderTracking";
import MyOrders from "@/pages/MyOrders";
import Offers from "@/pages/Offers";
import Favourites from "@/pages/Favourites";
import Profile from "@/pages/Profile";
import AuthCustomer from "@/pages/AuthCustomer";
import AdminLogin from "@/pages/AdminLogin";
import NotFound from "@/pages/NotFound";
import RDashboard from "@/pages/restaurant/RDashboard";
import ROrders from "@/pages/restaurant/ROrders";
import RProducts from "@/pages/restaurant/RProducts";
import RRestaurant from "@/pages/restaurant/RRestaurant";
import SDashboard from "@/pages/super/SDashboard";
import SRestaurants from "@/pages/super/SRestaurants";
import SOrders from "@/pages/super/SOrders";
import SCustomers from "@/pages/super/SCustomers";
import SCoupons from "@/pages/super/SCoupons";
import SSettings from "@/pages/super/SSettings";
import SCategories from "@/pages/super/SCategories";
import SCustomization from "@/pages/super/SCustomization";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <SiteConfigProvider>
            <BrowserRouter>
          <Toaster position="top-center" richColors />
          <Routes>
            {/* Customer public + protected */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/search" element={<Search />} />
              <Route path="/r/:id" element={<RestaurantDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute roles={["customer"]}><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute roles={["customer"]}><MyOrders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/favourites" element={<Favourites />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>

            <Route path="/login" element={<AuthCustomer mode="login" />} />
            <Route path="/signup" element={<AuthCustomer mode="signup" />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Restaurant admin */}
            <Route element={<ProtectedRoute roles={["restaurant_admin"]}><AdminLayout variant="restaurant" /></ProtectedRoute>}>
              <Route path="/admin" element={<RDashboard />} />
              <Route path="/admin/orders" element={<ROrders />} />
              <Route path="/admin/products" element={<RProducts />} />
              <Route path="/admin/analytics" element={<RDashboard />} />
              <Route path="/admin/restaurant" element={<RRestaurant />} />
            </Route>

            {/* Super admin */}
            <Route element={<ProtectedRoute roles={["super_admin"]}><AdminLayout variant="super" /></ProtectedRoute>}>
              <Route path="/super" element={<SDashboard />} />
              <Route path="/super/restaurants" element={<SRestaurants />} />
              <Route path="/super/orders" element={<SOrders />} />
              <Route path="/super/customers" element={<SCustomers />} />
              <Route path="/super/coupons" element={<SCoupons />} />
              <Route path="/super/categories" element={<SCategories />} />
              <Route path="/super/customization" element={<SCustomization />} />
              <Route path="/super/settings" element={<SSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </SiteConfigProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
