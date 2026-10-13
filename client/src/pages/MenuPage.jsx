import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { api, errorMessage } from '../api.js';
import { useCart } from '../CartContext.jsx';
import FoodCard from '../components/FoodCard.jsx';
import Notice from '../components/Notice.jsx';

export default function MenuPage() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [message, setMessage] = useState('');
  const { add } = useCart();

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch((reason) => setCategoryError(errorMessage(reason)));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/foods', { params: { search: search || undefined, categoryId: categoryId || undefined } })
      .then(({ data }) => { if (active) setFoods(data.foods); })
      .catch((reason) => { if (active) { setFoods([]); setError(errorMessage(reason)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, categoryId]);

  function addFood(food) {
    setMessage('');
    if (add(food)) setMessage(`${food.name} added to your cart.`);
    else setMessage(`Only ${food.stock} of ${food.name} are available.`);
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={15} /> YOUR CAMPUS CANTEEN, REIMAGINED</span>
          <h1>A good day<br />starts with <em>good food.</em></h1>
          <p>Fresh favourites from your campus kitchen. Order ahead, skip the queue, and pick up when it suits you.</p>
          <a className="button button-dark" href="#menu">Explore today’s menu <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-visual" aria-label="Illustration of a freshly prepared campus meal">
          <div className="hero-circle circle-one" /><div className="hero-circle circle-two" />
          <div className="hero-plate"><span>🍱</span></div>
          <div className="hero-sticker"><strong>FRESH</strong><span>every day</span></div>
          <span className="hero-sparkle sparkle-a">✳</span><span className="hero-sparkle sparkle-b">✳</span>
        </div>
        <div className="hero-bottom"><span>01 — FRESHLY MADE</span><span>02 — READY WHEN YOU ARE</span><span>03 — CASH AT PICKUP</span></div>
      </section>

      <section className="menu-section section-wrap" id="menu">
        <div className="section-heading">
          <div><span className="eyebrow">MADE FRESH ON CAMPUS</span><h2>Today’s menu<span className="heading-dot">.</span></h2></div>
          <span className="menu-caption">{foods.length} tasty {foods.length === 1 ? 'option' : 'options'} to choose from</span>
        </div>
        <div className="menu-toolbar">
          <label className="search-box">
            <Search size={18} />
            <input aria-label="Search food" placeholder="Search for a dish..." value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => setSearch('')}>×</button>}
          </label>
          <div className="category-filters" aria-label="Filter food by category">
            <button type="button" className={`filter-chip ${!categoryId ? 'active' : ''}`} onClick={() => setCategoryId('')}>All food</button>
            {categories.map((category) => (
              <button key={category.id} type="button" className={`filter-chip ${categoryId === String(category.id) ? 'active' : ''}`} onClick={() => setCategoryId(String(category.id))}>
                {category.name}
              </button>
            ))}
          </div>
        </div>
        <Notice kind="success" onClose={() => setMessage('')}>{message}</Notice>
        {categoryError && <Notice>{categoryError}</Notice>}
        {error && <Notice>{error}</Notice>}
        {loading ? <div className="loading-state"><span className="spinner" />Loading today’s menu...</div> : (
          foods.length ? <div className="food-grid">{foods.map((food) => <FoodCard key={food.id} food={food} onAdd={addFood} />)}</div> : error ? null :
            <div className="empty-state"><span className="empty-icon">🥣</span><h3>Nothing on the menu yet</h3><p>Try another search or category. New favourites may be added soon.</p></div>
        )}
      </section>
      <section className="pickup-banner section-wrap">
        <span className="pickup-icon">⏱</span><div><strong>More lunch. Less line.</strong><p>Place your order now and pick it up fresh at the canteen.</p></div><span className="pickup-note">PAY WHEN YOU PICK UP</span>
      </section>
    </>
  );
}
