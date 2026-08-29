import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

const KEY = "fudora_cart_v1";
const EMPTY = { restaurant: null, items: [] };

function loadCart() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.items) ? parsed : EMPTY;
  } catch { return EMPTY; }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) { hydrated.current = true; return; }
    localStorage.setItem(KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = (restaurant, product, onDifferent) => {
    if (cart.restaurant && cart.restaurant.id !== restaurant.id) {
      onDifferent?.(restaurant, product);
      return false;
    }
    const items = [...cart.items];
    const idx = items.findIndex(i => i.product.id === product.id);
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
    else items.push({ product, qty: 1 });
    setCart({ restaurant: { id: restaurant.id, name: restaurant.name, delivery_fee: restaurant.delivery_fee, min_order: restaurant.min_order, logo_url: restaurant.logo_url }, items });
    toast.success(`${product.name} added`);
    return true;
  };

  const setQty = (productId, qty) => {
    let items = cart.items.map(i => i.product.id === productId ? { ...i, qty } : i);
    items = items.filter(i => i.qty > 0);
    setCart(items.length ? { ...cart, items } : { restaurant: null, items: [] });
  };

  const clear = () => setCart({ restaurant: null, items: [] });

  const replaceWith = (restaurant, product) => {
    setCart({ restaurant: { id: restaurant.id, name: restaurant.name, delivery_fee: restaurant.delivery_fee, min_order: restaurant.min_order, logo_url: restaurant.logo_url }, items: [{ product, qty: 1 }] });
    toast.success("Cart replaced");
  };

  const count = cart.items.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.items.reduce((s, i) => s + (i.product.discount_price || i.product.price) * i.qty, 0);

  return (
    <CartCtx.Provider value={{ cart, addItem, setQty, clear, replaceWith, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}
