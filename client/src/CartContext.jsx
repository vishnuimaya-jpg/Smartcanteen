import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);
const storageKey = 'smartcanteen_cart';

function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const update = (next) => {
    setItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };
  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    add(food) {
      const existing = items.find((item) => item.id === food.id);
      if (existing?.quantity >= food.stock) return false;
      update(existing
        ? items.map((item) => item.id === food.id ? { ...item, quantity: item.quantity + 1, stock: food.stock } : item)
        : [...items, {
          id: food.id, name: food.name, price: Number(food.price), quantity: 1,
          stock: food.stock, imageUrl: food.imageUrl, categoryName: food.categoryName
        }]);
      return true;
    },
    setQuantity(id, quantity) {
      if (quantity <= 0) update(items.filter((item) => item.id !== id));
      else update(items.map((item) => item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item));
    },
    remove(id) { update(items.filter((item) => item.id !== id)); },
    clear() { update([]); }
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}
