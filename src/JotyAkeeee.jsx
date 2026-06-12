import { useState, useCallback, useEffect } from "react";

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const DEFAULT_CATEGORIES = ["Food", "Drinks", "Desserts", "Sides"];
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Cheeseburger", price: 12.99, category: "Food", emoji: "🍔" },
  { id: 2, name: "Margherita Pizza", price: 14.99, category: "Food", emoji: "🍕" },
  { id: 3, name: "Caesar Salad", price: 9.99, category: "Food", emoji: "🥗" },
  { id: 4, name: "Chicken Wrap", price: 10.99, category: "Food", emoji: "🌯" },
  { id: 5, name: "Fish & Chips", price: 13.99, category: "Food", emoji: "🐟" },
  { id: 6, name: "Pasta Bolognese", price: 11.99, category: "Food", emoji: "🍝" },
  { id: 7, name: "Coca-Cola", price: 2.99, category: "Drinks", emoji: "🥤" },
  { id: 8, name: "Fresh OJ", price: 3.99, category: "Drinks", emoji: "🍊" },
  { id: 9, name: "Latte", price: 4.49, category: "Drinks", emoji: "☕" },
  { id: 10, name: "Sparkling Water", price: 1.99, category: "Drinks", emoji: "💧" },
  { id: 11, name: "Craft Beer", price: 5.99, category: "Drinks", emoji: "🍺" },
  { id: 12, name: "Chocolate Cake", price: 6.99, category: "Desserts", emoji: "🎂" },
  { id: 13, name: "Ice Cream", price: 4.99, category: "Desserts", emoji: "🍦" },
  { id: 14, name: "Cheesecake", price: 5.99, category: "Desserts", emoji: "🍰" },
  { id: 15, name: "French Fries", price: 3.99, category: "Sides", emoji: "🍟" },
  { id: 16, name: "Onion Rings", price: 4.49, category: "Sides", emoji: "🧅" },
  { id: 17, name: "Coleslaw", price: 2.49, category: "Sides", emoji: "🥬" },
  { id: 18, name: "Garlic Bread", price: 3.49, category: "Sides", emoji: "🥖" },
];

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", emoji: "💵" },
  { id: "bkash_nagad", label: "bKash & Nagad", emoji: "📲" },
];

function formatBDT(n) { return "৳" + Number(n).toFixed(2); }
export default function JotyAkeeee() {
  const [products, setProducts]       = useState(() => load("ja_products", DEFAULT_PRODUCTS));
  const [categories, setCategories]   = useState(() => load("ja_categories", DEFAULT_CATEGORIES));
  const [allOrders, setAllOrders]     = useState(() => load("ja_orders", []));
  const [orderNum, setOrderNum]       = useState(() => load("ja_ordernum", 1001));
  const [cogsEntries, setCogsEntries] = useState(() => load("ja_cogs", []));
  const [periodCosts, setPeriodCosts] = useState(() => load("ja_period", []));

  useEffect(() => save("ja_products",   products),    [products]);
  useEffect(() => save("ja_categories", categories),  [categories]);
  useEffect(() => save("ja_orders",     allOrders),   [allOrders]);
  useEffect(() => save("ja_ordernum",   orderNum),    [orderNum]);
  useEffect(() => save("ja_cogs",       cogsEntries), [cogsEntries]);
  useEffect(() => save("ja_period",     periodCosts), [periodCosts]);

  const [activeTab, setActiveTab]               = useState("pos");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart]                         = useState([]);
  const [search, setSearch]                     = useState("");
  const [paymentMethod, setPaymentMethod]       = useState("cash");
  const [charged, setCharged]                   = useState(false);
  const [showReceipt, setShowReceipt]           = useState(false);
  const [lastOrder, setLastOrder]               = useState(null);
  const [discountInput, setDiscountInput]       = useState("");
  const [appliedDiscount, setAppliedDiscount]   = useState(0);
  const [newCatName, setNewCatName]             = useState("");
  const [newProduct, setNewProduct]             = useState({ name: "", price: "", category: "", emoji: "🛍️" });
  const [editingProductId, setEditingProductId] = useState(null);
  const [expandedCats, setExpandedCats]         = useState({});
  const [cogsForm, setCogsForm]                 = useState({ name: "", amount: "" });
  const [editingCogsId, setEditingCogsId]       = useState(null);
  const [periodForm, setPeriodForm]             = useState({ name: "", amount: "" });
  const [editingPeriodId, setEditingPeriodId]   = useState(null);
  const [ordersView, setOrdersView]             = useState("today");

  const allCats = ["All", ...categories];
  const filtered = products.filter(
    (p) => (selectedCategory === "All" || p.category === selectedCategory) &&
           p.name.toLowerCase().includes(search.toLowerCase())
  );

  const todayKey = new Date().toDateString();
  const todayOrders = allOrders.filter(o => o.dateKey === todayKey);
  const recentOrders = ordersView === "today" ? todayOrders : allOrders;

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const updateQty = (id, delta) =>
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i) => i.qty > 0));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = Math.min(appliedDiscount, subtotal);
  const total = subtotal - discountAmt;

  const applyDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0) setAppliedDiscount(val);
  };

  const handleCharge = () => {
    if (cart.length === 0) return;
    setCharged(true);
    const now = new Date();
    const order = {
      num: orderNum, items: [...cart], subtotal, discount: discountAmt, total,
      method: paymentMethod,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: now.toLocaleDateString("en-GB"),
      dateKey: now.toDateString(),
    };
    setLastOrder(order);
    setAllOrders((prev) => [order, ...prev]);
    setTimeout(() => {
      setCart([]); setAppliedDiscount(0); setDiscountInput("");
      setOrderNum((n) => n + 1); setCharged(false); setShowReceipt(true);
    }, 1200);
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    setCategories((prev) => [...prev, name]); setNewCatName("");
  };
  const deleteCategory = (cat) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
    setProducts((prev) => prev.filter((p) => p.category !== cat));
  };
  const saveProduct = () => {
    const price = parseFloat(newProduct.price);
    if (!newProduct.name.trim() || isNaN(price) || !newProduct.category) return;
    if (editingProductId) {
      setProducts((prev) => prev.map((p) => p.id === editingProductId ? { ...p, ...newProduct, price } : p));
      setEditingProductId(null);
    } else {
      setProducts((prev) => [...prev, { ...newProduct, price, id: Date.now() }]);
    }
    setNewProduct({ name: "", price: "", category: "", emoji: "🛍️" });
  };
  const startEditProduct = (p) => { setEditingProductId(p.id); setNewProduct({ name: p.name, price: String(p.price), category: p.category, emoji: p.emoji }); };
  const deleteProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id));
  const toggleCat = (cat) => setExpandedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const saveCogs = () => {
    const amount = parseFloat(cogsForm.amount);
    if (!cogsForm.name.trim() || isNaN(amount)) return;
    if (editingCogsId) {
      setCogsEntries((prev) => prev.map((e) => e.id === editingCogsId ? { ...e, name: cogsForm.name, amount } : e));
      setEditingCogsId(null);
    } else {
      setCogsEntries((prev) => [...prev, { name: cogsForm.name, amount, id: Date.now() }]);
    }
    setCogsForm({ name: "", amount: "" });
  };
  const startEditCogs = (e) => { setEditingCogsId(e.id); setCogsForm({ name: e.name, amount: String(e.amount) }); };
  const deleteCogs = (id) => setCogsEntries((prev) => prev.filter((e) => e.id !== id));

  const savePeriod = () => {
    const amount = parseFloat(periodForm.amount);
    if (!periodForm.name.trim() || isNaN(amount)) return;
    if (editingPeriodId) {
      setPeriodCosts((prev) => prev.map((e) => e.id === editingPeriodId ? { ...e, name: periodForm.name, amount } : e));
      setEditingPeriodId(null);
    } else {
      setPeriodCosts((prev) => [...prev, { name: periodForm.name, amount, id: Date.now() }]);
    }
    setPeriodForm({ name: "", amount: "" });
  };
  const startEditPeriod = (e) => { setEditingPeriodId(e.id); setPeriodForm({ name: e.name, amount: String(e.amount) }); };
  const deletePeriod = (id) => setPeriodCosts((prev) => prev.filter((e) => e.id !== id));

  const totalCogs    = cogsEntries.reduce((s, e) => s + e.amount, 0);
  const totalPeriod  = periodCosts.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const grossProfit  = totalRevenue - totalCogs;
  const netProfit    = grossProfit - totalPeriod;
  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>Joty Akeeee</span>
          <span style={s.badge}>Order #{orderNum}</span>
        </div>
        <nav style={s.nav}>
          {[["pos","🛒 POS"],["cashier","📦 Cashier"],["costs","📊 Costs"],["history","🧾 History"]].map(([id, label]) => (
            <button key={id} style={{ ...s.navBtn, ...(activeTab === id ? s.navActive : {}) }} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </nav>
        <div style={s.headerRight}>
          <span style={s.time}>{new Date().toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })}</span>
          <div style={s.avatar}>JA</div>
        </div>
      </header>

      {activeTab === "pos" && (
        <div style={s.body}>
          <div style={s.left}>
            <div style={s.toolbar}>
              <input style={s.search} placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <div style={s.cats}>
                {allCats.map((c) => (
                  <button key={c} style={{ ...s.catBtn, ...(selectedCategory === c ? s.catActive : {}) }} onClick={() => setSelectedCategory(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div style={s.grid}>
              {filtered.map((p) => {
                const inCart = cart.find((i) => i.id === p.id);
                return (
                  <button key={p.id} style={{ ...s.card, ...(inCart ? s.cardActive : {}) }} onClick={() => addToCart(p)}>
                    {inCart && <span style={s.cartBadge}>{inCart.qty}</span>}
                    <span style={s.emoji}>{p.emoji}</span>
                    <span style={s.cardName}>{p.name}</span>
                    <span style={s.cardPrice}>{formatBDT(p.price)}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && <div style={s.empty}>No items match "{search}"</div>}
            </div>
            <div style={s.todaySummary}>
              <div style={s.sectionLabel}>Today's Summary</div>
              <div style={s.todayRow}>
                <div style={s.todayStat}><span style={s.todayVal}>{todayOrders.length}</span><span style={s.todayLbl}>Orders</span></div>
                <div style={s.todayStat}><span style={{ ...s.todayVal, color: "#2dd4bf" }}>{formatBDT(todayRevenue)}</span><span style={s.todayLbl}>Revenue</span></div>
              </div>
            </div>
          </div>

          <div style={s.right}>
            <div style={s.orderHeader}>
              <span style={s.orderTitle}>Current Order</span>
              {cart.length > 0 && <button style={s.clearBtn} onClick={() => { setCart([]); setAppliedDiscount(0); setDiscountInput(""); }}>Clear</button>}
            </div>
            <div style={s.cartList}>
              {cart.length === 0 ? (
                <div style={s.emptyCart}><span style={{ fontSize: 40 }}>🛒</span><span style={{ color: "#64748b", marginTop: 8 }}>Tap items to add</span></div>
              ) : cart.map((item) => (
                <div key={item.id} style={s.cartItem}>
                  <span style={s.cartEmoji}>{item.emoji}</span>
                  <div style={s.cartInfo}>
                    <span style={s.cartName}>{item.name}</span>
                    <span style={s.cartUnit}>{formatBDT(item.price)} each</span>
                  </div>
                  <div style={s.qtyControl}>
                    <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                    <span style={s.qtyNum}>{item.qty}</span>
                    <button style={s.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  <span style={s.cartTotal}>{formatBDT(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={s.discountBox}>
                <div style={s.discountLabel}>Discount (BDT)</div>
                <div style={s.discountRow}>
                  <input style={s.discountInput} placeholder="e.g. 50" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyDiscount()} type="number" min="0" />
                  <button style={s.discountApply} onClick={applyDiscount}>Apply</button>
                </div>
              </div>
            )}
            <div style={s.totals}>
              <div style={s.totalRow}><span style={s.totalLabel}>Subtotal</span><span style={s.totalVal}>{formatBDT(subtotal)}</span></div>
              {appliedDiscount > 0 && <div style={s.totalRow}><span style={{ ...s.totalLabel, color: "#2dd4bf" }}>Discount</span><span style={{ ...s.totalVal, color: "#2dd4bf" }}>−{formatBDT(discountAmt)}</span></div>}
              <div style={s.divider} />
              <div style={s.totalRow}><span style={s.grandLabel}>Total</span><span style={s.grandVal}>{formatBDT(total)}</span></div>
            </div>
            <div style={s.paySection}>
              <div style={s.payLabel}>Payment Method</div>
              <div style={s.paymentRow}>
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.id} style={{ ...s.payBtn, ...(paymentMethod === m.id ? s.payActive : {}) }} onClick={() => setPaymentMethod(m.id)}>
                    <span style={{ fontSize: 20 }}>{m.emoji}</span><span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button style={{ ...s.chargeBtn, ...(cart.length === 0 ? s.chargeBtnDisabled : {}), ...(charged ? s.chargeBtnSuccess : {}) }} onClick={handleCharge} disabled={cart.length === 0}>
              {charged ? "✓ Charged!" : `Charge ${formatBDT(total)}`}
            </button>
          </div>
        </div>
      )}
