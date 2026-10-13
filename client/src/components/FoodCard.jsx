import { Plus } from 'lucide-react';

const icons = {
  Breakfast: '🍳',
  Meals: '🍛',
  Snacks: '🥪',
  Beverages: '🥤',
  Desserts: '🍮'
};

export default function FoodCard({ food, onAdd }) {
  const available = Boolean(food.available ?? (food.isAvailable && food.stock > 0));
  return (
    <article className={`food-card ${!available ? 'food-unavailable' : ''}`}>
      <div className="food-art">
        {food.imageUrl
          ? <img src={food.imageUrl} alt={food.name} loading="lazy" />
          : <span aria-hidden="true">{icons[food.categoryName] || '🍽️'}</span>}
        {!available && <span className="sold-out">Sold out</span>}
        <span className="category-pill">{food.categoryName}</span>
      </div>
      <div className="food-info">
        <div className="food-title-row">
          <h3>{food.name}</h3>
          <strong>₹{Number(food.price).toFixed(2)}</strong>
        </div>
        <p>{food.description || 'Freshly prepared in our campus kitchen.'}</p>
        <div className="food-action-row">
          <span className="stock-note">{available ? `${food.stock} available` : 'Currently unavailable'}</span>
          <button className="button button-small button-primary" type="button" disabled={!available} onClick={() => onAdd(food)}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
