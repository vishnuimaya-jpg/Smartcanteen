import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Box, ClipboardList, Plus, Trash2, Utensils } from 'lucide-react';
import { api, errorMessage } from '../api.js';
import Notice from '../components/Notice.jsx';

const blankFood = { name: '', description: '', categoryId: '', price: '', imageUrl: '', stock: '0', isAvailable: true };
const statuses = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'];

export default function AdminPage() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState(null);
  const [foodForm, setFoodForm] = useState(blankFood);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [foodResponse, categoryResponse, orderResponse, reportResponse] = await Promise.all([
        api.get('/foods'), api.get('/categories'), api.get('/admin/orders'), api.get('/admin/reports')
      ]);
      setFoods(foodResponse.data.foods);
      setCategories(categoryResponse.data.categories);
      setOrders(orderResponse.data.orders);
      setReport(reportResponse.data);
      setFoodForm((current) => current.categoryId ? current : { ...current, categoryId: String(categoryResponse.data.categories[0]?.id || '') });
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveFood(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    const body = {
      ...foodForm,
      categoryId: Number(foodForm.categoryId),
      price: Number(foodForm.price),
      stock: Number(foodForm.stock)
    };
    try {
      await api.post('/foods', body);
      setFoodForm({ ...blankFood, categoryId: String(categories[0]?.id || '') });
      setNotice('Food item added to the menu.');
      await load();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function editFood(food) {
    const name = window.prompt('Food name:', food.name);
    if (name === null) return;
    const price = window.prompt('Price in ₹:', food.price);
    if (price === null) return;
    const stock = window.prompt('Available stock:', food.stock);
    if (stock === null) return;
    const description = window.prompt('Description:', food.description);
    if (description === null) return;
    const categoryOptions = categories.map((category) => `${category.id}: ${category.name}`).join('\n');
    const categoryId = window.prompt(`Category ID:\n${categoryOptions}`, String(food.categoryId));
    if (categoryId === null) return;
    const availability = window.prompt('Available for orders? Enter yes or no:', food.isAvailable ? 'yes' : 'no');
    if (availability === null) return;
    if (!['yes', 'no'].includes(availability.trim().toLowerCase())) {
      setError('Availability must be answered with yes or no.');
      return;
    }
    setError('');
    try {
      await api.put(`/foods/${food.id}`, {
        name, price: Number(price), stock: Number(stock), description,
        categoryId: Number(categoryId), imageUrl: food.imageUrl || '',
        isAvailable: availability.trim().toLowerCase() === 'yes'
      });
      setNotice(`${name} updated.`);
      await load();
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function deleteFood(food) {
    if (!window.confirm(`Delete ${food.name} from the menu? Existing order history will be retained.`)) return;
    setError('');
    try {
      await api.delete(`/foods/${food.id}`);
      setNotice(`${food.name} deleted.`);
      await load();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function addCategory(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/categories', { name: categoryName });
      setCategoryName('');
      setNotice('Category created.');
      await load();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function editCategory(category) {
    const name = window.prompt('Category name:', category.name);
    if (name === null) return;
    setError('');
    try {
      await api.put(`/categories/${category.id}`, { name });
      setNotice('Category updated.');
      await load();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete the “${category.name}” category? It must have no food items.`)) return;
    setError('');
    try {
      await api.delete(`/categories/${category.id}`);
      setNotice('Category deleted.');
      await load();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function changeStatus(orderId, status) {
    setError('');
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      setNotice(`Order #${orderId} marked ${status.toLowerCase()}.`);
      await load();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  if (loading && !report) return <section className="section-wrap content-page"><div className="loading-state"><span className="spinner" />Loading admin dashboard...</div></section>;

  return (
    <section className="section-wrap admin-page">
      <div className="admin-heading"><div><span className="eyebrow">CANTEEN CONTROL ROOM</span><h1>Dashboard<span className="heading-dot">.</span></h1><p>Manage the menu, stock and campus orders from one place.</p></div><button type="button" className="button button-outline" onClick={load}>Refresh data</button></div>
      {error && <Notice>{error}</Notice>}{notice && <Notice kind="success" onClose={() => setNotice('')}>{notice}</Notice>}
      <div className="stat-grid">
        <article className="stat-card"><span className="stat-icon stat-icon-peach"><ClipboardList size={20} /></span><span>Total orders</span><strong>{report?.summary.totalOrders ?? '—'}</strong></article>
        <article className="stat-card"><span className="stat-icon stat-icon-green"><BarChart3 size={20} /></span><span>Recorded sales</span><strong>₹{Number(report?.summary.grossSales || 0).toFixed(2)}</strong></article>
        <article className="stat-card"><span className="stat-icon stat-icon-yellow"><Box size={20} /></span><span>Pending orders</span><strong>{report?.summary.pendingOrders ?? 0}</strong></article>
        <article className="stat-card"><span className="stat-icon stat-icon-lilac"><Utensils size={20} /></span><span>Menu items</span><strong>{foods.length}</strong></article>
      </div>
      <div className="admin-columns">
        <section className="admin-panel">
          <div className="panel-heading"><div><span className="eyebrow">MENU MANAGEMENT</span><h2>Add a food item</h2></div></div>
          {categories.length ? (
            <form className="admin-form" onSubmit={saveFood}>
              <label>Food name<input required minLength="2" maxLength="120" value={foodForm.name} onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })} /></label>
              <label>Category<select required value={foodForm.categoryId} onChange={(e) => setFoodForm({ ...foodForm, categoryId: e.target.value })}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
              <div className="form-row"><label>Price (₹)<input required type="number" min="0.01" step="0.01" value={foodForm.price} onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })} /></label><label>Stock<input required type="number" min="0" step="1" value={foodForm.stock} onChange={(e) => setFoodForm({ ...foodForm, stock: e.target.value })} /></label></div>
              <label>Description<textarea maxLength="500" rows="2" value={foodForm.description} onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })} /></label>
              <label>Image URL <span className="optional-label">(optional)</span><input type="url" value={foodForm.imageUrl} onChange={(e) => setFoodForm({ ...foodForm, imageUrl: e.target.value })} /></label>
              <label className="checkbox-label"><input type="checkbox" checked={foodForm.isAvailable} onChange={(e) => setFoodForm({ ...foodForm, isAvailable: e.target.checked })} /> Available to order</label>
              <button className="button button-primary" type="submit" disabled={saving}><Plus size={16} /> {saving ? 'Adding...' : 'Add to menu'}</button>
            </form>
          ) : <p className="muted-copy">Create a category before adding food items.</p>}
        </section>
        <section className="admin-panel">
          <div className="panel-heading"><div><span className="eyebrow">ORGANIZE YOUR MENU</span><h2>Categories</h2></div><span className="panel-count">{categories.length}</span></div>
          <form className="category-form" onSubmit={addCategory}><input aria-label="New category name" required minLength="2" maxLength="80" placeholder="e.g. Specials" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /><button type="submit" className="button button-primary" aria-label="Add category"><Plus size={17} /></button></form>
          <div className="category-admin-list">{categories.map((category) => <div className="category-admin-row" key={category.id}><span>{category.name}</span><span className="category-item-count">{category.itemCount} items</span><button type="button" className="text-button" onClick={() => editCategory(category)}>Edit</button><button type="button" className="icon-button" aria-label={`Delete ${category.name}`} onClick={() => deleteCategory(category)}><Trash2 size={15} /></button></div>)}</div>
        </section>
      </div>
      <section className="admin-panel table-panel">
        <div className="panel-heading"><div><span className="eyebrow">CURRENT OFFERING</span><h2>Menu items</h2></div><span className="panel-count">{foods.length} items</span></div>
        {foods.length ? <div className="table-scroll"><table><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Stock</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{foods.map((food) => <tr key={food.id}><td><strong>{food.name}</strong></td><td>{food.categoryName}</td><td>₹{Number(food.price).toFixed(2)}</td><td>{food.stock}</td><td><span className={`availability ${food.available ? 'available' : 'unavailable'}`}>{food.available ? 'Available' : 'Unavailable'}</span></td><td className="table-actions"><button type="button" className="text-button" onClick={() => editFood(food)}>Edit</button><button type="button" className="text-button danger-text" onClick={() => deleteFood(food)}>Delete</button></td></tr>)}</tbody></table></div> : <p className="muted-copy">No food items yet.</p>}
      </section>
      <section className="admin-panel table-panel">
        <div className="panel-heading"><div><span className="eyebrow">LIVE ORDER QUEUE</span><h2>Student orders</h2></div><span className="panel-count">{orders.length}</span></div>
        {orders.length ? <div className="table-scroll"><table><thead><tr><th>Order</th><th>Student</th><th>Items total</th><th>Amount</th><th>Placed</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>#{order.id}</strong></td><td>{order.studentName}<small className="table-subtext">{order.studentEmail}</small></td><td>{order.items?.length ?? '—'}</td><td>₹{Number(order.totalAmount).toFixed(2)}</td><td>{new Date(order.createdAt).toLocaleString()}</td><td><select className="status-select" aria-label={`Status for order ${order.id}`} value={order.status} disabled={order.status === 'Completed' || order.status === 'Cancelled'} onChange={(event) => changeStatus(order.id, event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div> : <p className="muted-copy">No orders have been placed yet.</p>}
      </section>
      <section className="admin-panel sales-panel"><div className="panel-heading"><div><span className="eyebrow">LAST 7 DAYS</span><h2>Sales & order report</h2></div></div>
        {report?.dailySales?.length ? <div className="sales-list">{report.dailySales.map((day) => <div className="sales-row" key={String(day.date)}><span>{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span>{day.orderCount} orders</span><strong>₹{Number(day.sales).toFixed(2)}</strong></div>)}</div> : <p className="muted-copy">Daily sales will appear here when orders are placed.</p>}
      </section>
    </section>
  );
}
