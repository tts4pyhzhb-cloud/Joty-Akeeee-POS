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
      {activeTab === "cashier" && (
        <div style={s.cashierBody}>
          <div style={s.cashierLeft}>
            <div style={s.panelTitle}>Product Catalogue</div>
            {categories.map((cat) => {
              const catProducts = products.filter((p) => p.category === cat);
              const isOpen = expandedCats[cat] !== false;
              return (
                <div key={cat} style={s.catBlock}>
                  <div style={s.catRow}>
                    <button style={s.catToggle} onClick={() => toggleCat(cat)}>
                      <span style={s.catToggleIcon}>{isOpen ? "▾" : "▸"}</span>
                      <span style={s.catToggleName}>{cat}</span>
                      <span style={s.catCount}>{catProducts.length} items</span>
                    </button>
                    <button style={s.deleteSmBtn} onClick={() => deleteCategory(cat)}>✕</button>
                  </div>
                  {isOpen && (
                    <div style={s.catProducts}>
                      {catProducts.length === 0 && <div style={s.noCatProducts}>No products yet</div>}
                      {catProducts.map((p) => (
                        <div key={p.id} style={s.productRow}>
                          <span style={s.productEmoji}>{p.emoji}</span>
                          <span style={s.productName}>{p.name}</span>
                          <span style={s.productPrice}>{formatBDT(p.price)}</span>
                          <button style={s.editSmBtn} onClick={() => startEditProduct(p)}>Edit</button>
                          <button style={s.deleteSmBtn} onClick={() => deleteProduct(p.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={s.cashierRight}>
            <div style={s.formCard}>
              <div style={s.formCardTitle}>Add Category</div>
              <div style={s.formRow}>
                <input style={s.formInput} placeholder="Category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
                <button style={s.formBtn} onClick={addCategory}>Add</button>
              </div>
            </div>
            <div style={s.formCard}>
              <div style={s.formCardTitle}>{editingProductId ? "Edit Product" : "Add Product"}</div>
              <input style={s.formInput} placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
              <div style={{ ...s.formRow, marginTop: 8 }}>
                <input style={s.formInput} placeholder="Price (BDT)" type="number" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} />
                <input style={s.formInput} placeholder="Emoji" value={newProduct.emoji} onChange={(e) => setNewProduct((p) => ({ ...p, emoji: e.target.value }))} />
              </div>
              <select style={{ ...s.formInput, marginTop: 8 }} value={newProduct.category} onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ ...s.formRow, marginTop: 10 }}>
                <button style={s.formBtn} onClick={saveProduct}>{editingProductId ? "Save Changes" : "Add Product"}</button>
                {editingProductId && <button style={s.cancelBtn} onClick={() => { setEditingProductId(null); setNewProduct({ name: "", price: "", category: "", emoji: "🛍️" }); }}>Cancel</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "costs" && (
        <div style={s.costsBody}>
          <div style={s.summaryRow}>
            {[
              { label: "All-Time Revenue", value: formatBDT(totalRevenue), color: "#2dd4bf" },
              { label: "Total COGS", value: formatBDT(totalCogs), color: "#f87171" },
              { label: "Gross Profit", value: formatBDT(grossProfit), color: grossProfit >= 0 ? "#4ade80" : "#f87171" },
              { label: "Period Costs", value: formatBDT(totalPeriod), color: "#fb923c" },
              { label: "Net Profit", value: formatBDT(netProfit), color: netProfit >= 0 ? "#4ade80" : "#f87171" },
            ].map((item) => (
              <div key={item.label} style={s.summaryCard}>
                <div style={s.summaryLabel}>{item.label}</div>
                <div style={{ ...s.summaryValue, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={s.costsColumns}>
            <div style={s.costsPanel}>
              <div style={s.costsPanelHeader}><span style={s.panelTitle}>COGS</span><span style={s.panelTotal}>{formatBDT(totalCogs)}</span></div>
              <div style={s.costsList}>
                {cogsEntries.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>No entries yet</div>}
                {cogsEntries.map((e) => (
                  <div key={e.id} style={s.costsItem}>
                    <span style={s.costsItemName}>{e.name}</span>
                    <span style={s.costsItemAmt}>{formatBDT(e.amount)}</span>
                    <button style={s.editSmBtn} onClick={() => startEditCogs(e)}>Edit</button>
                    <button style={s.deleteSmBtn} onClick={() => deleteCogs(e.id)}>✕</button>
                  </div>
                ))}
              </div>
              <div style={s.costsForm}>
                <div style={s.formCardTitle}>{editingCogsId ? "Edit COGS" : "Add COGS Entry"}</div>
                <input style={s.formInput} placeholder="Item name" value={cogsForm.name} onChange={(e) => setCogsForm((f) => ({ ...f, name: e.target.value }))} />
                <div style={{ ...s.formRow, marginTop: 8 }}>
                  <input style={s.formInput} placeholder="Amount (BDT)" type="number" value={cogsForm.amount} onChange={(e) => setCogsForm((f) => ({ ...f, amount: e.target.value }))} />
                  <button style={s.formBtn} onClick={saveCogs}>{editingCogsId ? "Save" : "Add"}</button>
                  {editingCogsId && <button style={s.cancelBtn} onClick={() => { setEditingCogsId(null); setCogsForm({ name: "", amount: "" }); }}>Cancel</button>}
                </div>
              </div>
            </div>
            <div style={s.costsPanel}>
              <div style={s.costsPanelHeader}><span style={s.panelTitle}>Period Costs</span><span style={s.panelTotal}>{formatBDT(totalPeriod)}</span></div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Fixed recurring costs (rent, salaries, utilities…)</div>
              <div style={s.costsList}>
                {periodCosts.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>No entries yet</div>}
                {periodCosts.map((e) => (
                  <div key={e.id} style={s.costsItem}>
                    <span style={s.costsItemName}>{e.name}</span>
                    <span style={s.costsItemAmt}>{formatBDT(e.amount)}</span>
                    <button style={s.editSmBtn} onClick={() => startEditPeriod(e)}>Edit</button>
                    <button style={s.deleteSmBtn} onClick={() => deletePeriod(e.id)}>✕</button>
                  </div>
                ))}
              </div>
              <div style={s.costsForm}>
                <div style={s.formCardTitle}>{editingPeriodId ? "Edit Period Cost" : "Add Period Cost"}</div>
                <input style={s.formInput} placeholder="Cost name" value={periodForm.name} onChange={(e) => setPeriodForm((f) => ({ ...f, name: e.target.value }))} />
                <div style={{ ...s.formRow, marginTop: 8 }}>
                  <input style={s.formInput} placeholder="Amount (BDT)" type="number" value={periodForm.amount} onChange={(e) => setPeriodForm((f) => ({ ...f, amount: e.target.value }))} />
                  <button style={s.formBtn} onClick={savePeriod}>{editingPeriodId ? "Save" : "Add"}</button>
                  {editingPeriodId && <button style={s.cancelBtn} onClick={() => { setEditingPeriodId(null); setPeriodForm({ name: "", amount: "" }); }}>Cancel</button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "history" && (
        <div style={s.historyBody}>
          <div style={s.historyHeader}>
            <div style={s.panelTitle}>Transaction History</div>
            <div style={s.toggleRow}>
              <button style={{ ...s.toggleBtn, ...(ordersView === "today" ? s.toggleActive : {}) }} onClick={() => setOrdersView("today")}>Today ({todayOrders.length})</button>
              <button style={{ ...s.toggleBtn, ...(ordersView === "all" ? s.toggleActive : {}) }} onClick={() => setOrdersView("all")}>All Time ({allOrders.length})</button>
            </div>
          </div>
          <div style={s.historyStats}>
            <div style={s.hStat}><span style={s.hStatVal}>{recentOrders.length}</span><span style={s.hStatLbl}>Orders</span></div>
            <div style={s.hStat}><span style={{ ...s.hStatVal, color: "#2dd4bf" }}>{formatBDT(recentOrders.reduce((s, o) => s + o.total, 0))}</span><span style={s.hStatLbl}>Revenue</span></div>
            <div style={s.hStat}><span style={{ ...s.hStatVal, color: "#f59e0b" }}>{formatBDT(recentOrders.reduce((s, o) => s + o.discount, 0))}</span><span style={s.hStatLbl}>Discounts Given</span></div>
          </div>
          {recentOrders.length === 0 ? (
            <div style={s.emptyHistory}>No transactions yet. Start selling! 🚀</div>
          ) : (
            <div style={s.ordersList}>
              {recentOrders.map((o) => (
                <div key={o.num} style={s.orderCard}>
                  <div style={s.orderCardTop}>
                    <span style={s.orderCardNum}>#{o.num}</span>
                    <span style={s.orderCardDate}>{o.date} · {o.time}</span>
                    <span style={{ ...s.pill, background: o.method === "cash" ? "#2dd4bf22" : "#a855f722", color: o.method === "cash" ? "#2dd4bf" : "#a855f7" }}>
                      {o.method === "cash" ? "💵 Cash" : "📲 bKash/Nagad"}
                    </span>
                  </div>
                  <div style={s.orderCardItems}>{o.items.map((i) => `${i.emoji} ${i.name} ×${i.qty}`).join("  ·  ")}</div>
                  <div style={s.orderCardBottom}>
                    {o.discount > 0 && <span style={{ color: "#2dd4bf", fontSize: 12 }}>Discount −{formatBDT(o.discount)}</span>}
                    <span style={s.orderCardTotal}>{formatBDT(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReceipt && lastOrder && (
        <div style={s.overlay} onClick={() => setShowReceipt(false)}>
          <div style={s.receipt} onClick={(e) => e.stopPropagation()}>
            <div style={s.receiptHeader}>
              <span style={s.receiptLogo}>Joty Akeeee</span>
              <span style={s.receiptSub}>Order #{lastOrder.num} · {lastOrder.time}</span>
            </div>
            <div style={s.receiptDivider} />
            {lastOrder.items.map((i) => (
              <div key={i.id} style={s.receiptRow}><span>{i.emoji} {i.name} × {i.qty}</span><span>{formatBDT(i.price * i.qty)}</span></div>
            ))}
            <div style={s.receiptDivider} />
            <div style={s.receiptRow}><span>Subtotal</span><span>{formatBDT(lastOrder.subtotal)}</span></div>
            {lastOrder.discount > 0 && <div style={{ ...s.receiptRow, color: "#2dd4bf" }}><span>Discount</span><span>−{formatBDT(lastOrder.discount)}</span></div>}
            <div style={{ ...s.receiptRow, fontWeight: 700, fontSize: 18, marginTop: 8 }}><span>Total</span><span>{formatBDT(lastOrder.total)}</span></div>
            <div style={{ textAlign: "center", marginTop: 12, color: "#64748b", fontSize: 13 }}>
              Paid by {lastOrder.method === "cash" ? "Cash" : "bKash & Nagad"}
            </div>
            <button style={s.receiptClose} onClick={() => setShowReceipt(false)}>New Order</button>
          </div>
        </div>
      )}
    </div>
  );
}
const s = {
  root: { fontFamily: "'Inter', system-ui, sans-serif", background: "#0f1623", minHeight: "100vh", color: "#f8f6f1", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "#1a1f2e", borderBottom: "1px solid #2a3040", flexWrap: "wrap", gap: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  logo: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "#f59e0b" },
  badge: { fontSize: 12, fontWeight: 600, color: "#94a3b8", background: "#2a3040", borderRadius: 20, padding: "3px 12px" },
  nav: { display: "flex", gap: 6, flexWrap: "wrap" },
  navBtn: { background: "transparent", border: "1px solid #2a3040", borderRadius: 10, color: "#94a3b8", padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  navActive: { background: "#f59e0b22", border: "1px solid #f59e0b", color: "#f59e0b" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  time: { fontSize: 12, color: "#64748b" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "#f59e0b", color: "#0f1623", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  left: { flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px", overflowY: "auto", gap: 20 },
  toolbar: { display: "flex", flexDirection: "column", gap: 10 },
  search: { background: "#1a1f2e", border: "1px solid #2a3040", borderRadius: 10, padding: "10px 16px", color: "#f8f6f1", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  cats: { display: "flex", gap: 8, flexWrap: "wrap" },
  catBtn: { background: "#1a1f2e", border: "1px solid #2a3040", borderRadius: 20, padding: "6px 16px", color: "#94a3b8", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  catActive: { background: "#f59e0b", border: "1px solid #f59e0b", color: "#0f1623", fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 },
  card: { background: "#1a1f2e", border: "1px solid #2a3040", borderRadius: 14, padding: "18px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", position: "relative", textAlign: "center" },
  cardActive: { border: "1.5px solid #f59e0b", background: "#1e2435", boxShadow: "0 0 0 3px rgba(245,158,11,0.15)" },
  cartBadge: { position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#0f1623", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 32 },
  cardName: { fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 },
  cardPrice: { fontSize: 14, fontWeight: 700, color: "#f59e0b" },
  empty: { color: "#64748b", fontSize: 14, gridColumn: "1/-1", padding: "24px 0" },
  todaySummary: { background: "#1a1f2e", borderRadius: 12, padding: "16px", border: "1px solid #2a3040" },
  todayRow: { display: "flex", gap: 24, marginTop: 8 },
  todayStat: { display: "flex", flexDirection: "column", gap: 2 },
  todayVal: { fontSize: 22, fontWeight: 800, color: "#f8f6f1" },
  todayLbl: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  right: { width: 360, background: "#1a1f2e", borderLeft: "1px solid #2a3040", display: "flex", flexDirection: "column", padding: "20px", gap: 14, overflowY: "auto" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  orderTitle: { fontSize: 17, fontWeight: 700, color: "#f8f6f1" },
  clearBtn: { background: "transparent", border: "1px solid #2a3040", borderRadius: 8, color: "#64748b", fontSize: 12, padding: "4px 12px", cursor: "pointer" },
  cartList: { display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 100 },
  emptyCart: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 4, paddingTop: 24 },
  cartItem: { display: "flex", alignItems: "center", gap: 10, background: "#0f1623", borderRadius: 12, padding: "10px 14px" },
  cartEmoji: { fontSize: 22 },
  cartInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  cartName: { fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  cartUnit: { fontSize: 11, color: "#64748b" },
  qtyControl: { display: "flex", alignItems: "center", gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 8, background: "#2a3040", border: "none", color: "#f8f6f1", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 14, fontWeight: 700, minWidth: 18, textAlign: "center" },
  cartTotal: { fontSize: 14, fontWeight: 700, color: "#f8f6f1", minWidth: 52, textAlign: "right" },
  discountBox: { background: "#0f1623", borderRadius: 12, padding: "12px 14px" },
  discountLabel: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  discountRow: { display: "flex", gap: 8 },
  discountInput: { flex: 1, background: "#1a1f2e", border: "1px solid #2a3040", borderRadius: 8, padding: "8px 12px", color: "#f8f6f1", fontSize: 13, outline: "none" },
  discountApply: { background: "#2a3040", border: "none", borderRadius: 8, color: "#f8f6f1", padding: "8px 14px", fontSize: 13, cursor: "pointer" },
  totals: { background: "#0f1623", borderRadius: 14, padding: "16px" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 14 },
  totalLabel: { color: "#94a3b8" },
  totalVal: { color: "#e2e8f0", fontWeight: 500 },
  divider: { height: 1, background: "#2a3040", margin: "10px 0" },
  grandLabel: { fontSize: 17, fontWeight: 700, color: "#f8f6f1" },
  grandVal: { fontSize: 22, fontWeight: 800, color: "#f59e0b" },
  paySection: {},
  payLabel: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  paymentRow: { display: "flex", gap: 8 },
  payBtn: { flex: 1, background: "#0f1623", border: "1.5px solid #2a3040", borderRadius: 10, color: "#94a3b8", padding: "10px 6px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  payActive: { border: "1.5px solid #f59e0b", color: "#f59e0b", background: "#1e1a10" },
  chargeBtn: { background: "#f59e0b", border: "none", borderRadius: 14, color: "#0f1623", fontSize: 16, fontWeight: 800, padding: "16px", cursor: "pointer", letterSpacing: "-0.3px" },
  chargeBtnDisabled: { background: "#2a3040", color: "#64748b", cursor: "not-allowed" },
  chargeBtnSuccess: { background: "#2dd4bf", color: "#0f1623" },
  cashierBody: { display: "flex", flex: 1, overflow: "hidden" },
  cashierLeft: { flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 },
  cashierRight: { width: 320, background: "#1a1f2e", borderLeft: "1px solid #2a3040", padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 },
  panelTitle: { fontSize: 15, fontWeight: 700, color: "#f8f6f1", marginBottom: 12 },
  catBlock: { background: "#1a1f2e", borderRadius: 12, overflow: "hidden", border: "1px solid #2a3040" },
  catRow: { display: "flex", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #2a3040" },
  catToggle: { flex: 1, display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", textAlign: "left" },
  catToggleIcon: { fontSize: 14, color: "#64748b" },
  catToggleName: { fontSize: 14, fontWeight: 700, color: "#f8f6f1" },
  catCount: { fontSize: 11, color: "#64748b", marginLeft: 8 },
  catProducts: { display: "flex", flexDirection: "column" },
  noCatProducts: { padding: "12px 16px", fontSize: 13, color: "#64748b" },
  productRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid #1a2030", fontSize: 13 },
  productEmoji: { fontSize: 20, minWidth: 28 },
  productName: { flex: 1, color: "#e2e8f0", fontWeight: 500 },
  productPrice: { color: "#f59e0b", fontWeight: 700, minWidth: 70, textAlign: "right" },
  editSmBtn: { background: "#2a3040", border: "none", borderRadius: 6, color: "#94a3b8", padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 },
  deleteSmBtn: { background: "transparent", border: "none", color: "#64748b", fontSize: 14, cursor: "pointer", padding: "4px 6px" },
  formCard: { background: "#0f1623", borderRadius: 12, padding: "16px" },
  formCardTitle: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  formRow: { display: "flex", gap: 8 },
  formInput: { flex: 1, background: "#1a1f2e", border: "1px solid #2a3040", borderRadius: 8, padding: "8px 12px", color: "#f8f6f1", fontSize: 13, outline: "none" },
  formBtn: { background: "#f59e0b", border: "none", borderRadius: 8, color: "#0f1623", padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  cancelBtn: { background: "#2a3040", border: "none", borderRadius: 8, color: "#94a3b8", padding: "8px 12px", fontSize: 13, cursor: "pointer" },
  costsBody: { flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 },
  summaryRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  summaryCard: { flex: "1 1 150px", background: "#1a1f2e", borderRadius: 14, padding: "16px 20px", border: "1px solid #2a3040" },
  summaryLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: 800 },
  costsColumns: { display: "flex", gap: 20, flexWrap: "wrap", flex: 1 },
  costsPanel: { flex: "1 1 340px", background: "#1a1f2e", borderRadius: 14, padding: "20px", border: "1px solid #2a3040", display: "flex", flexDirection: "column" },
  costsPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  panelTotal: { fontSize: 16, fontWeight: 800, color: "#f59e0b" },
  costsList: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  costsItem: { display: "flex", alignItems: "center", gap: 10, background: "#0f1623", borderRadius: 10, padding: "10px 14px", fontSize: 13 },
  costsItemName: { flex: 1, color: "#e2e8f0" },
  costsItemAmt: { fontWeight: 700, color: "#f8f6f1", minWidth: 80, textAlign: "right" },
  costsForm: { marginTop: "auto", paddingTop: 16, borderTop: "1px solid #2a3040" },
  historyBody: { flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 },
  historyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 },
  toggleRow: { display: "flex", gap: 8 },
  toggleBtn: { background: "#1a1f2e", border: "1px solid #2a3040", borderRadius: 10, color: "#94a3b8", padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  toggleActive: { background: "#f59e0b22", border: "1px solid #f59e0b", color: "#f59e0b" },
  historyStats: { display: "flex", gap: 16, flexWrap: "wrap" },
  hStat: { background: "#1a1f2e", borderRadius: 12, padding: "14px 20px", border: "1px solid #2a3040", display: "flex", flexDirection: "column", gap: 4, flex: "1 1 120px" },
  hStatVal: { fontSize: 22, fontWeight: 800, color: "#f8f6f1" },
  hStatLbl: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 },
  emptyHistory: { color: "#64748b", fontSize: 15, textAlign: "center", paddingTop: 40 },
  ordersList: { display: "flex", flexDirection: "column", gap: 10 },
  orderCard: { background: "#1a1f2e", borderRadius: 14, padding: "16px", border: "1px solid #2a3040", display: "flex", flexDirection: "column", gap: 8 },
  orderCardTop: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  orderCardNum: { fontWeight: 800, color: "#f59e0b", fontSize: 15 },
  orderCardDate: { fontSize: 12, color: "#64748b", flex: 1 },
  orderCardItems: { fontSize: 13, color: "#94a3b8" },
  orderCardBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  orderCardTotal: { fontSize: 16, fontWeight: 800, color: "#f8f6f1" },
  pill: { borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  receipt: { background: "#1a1f2e", borderRadius: 20, padding: "28px", width: 320, border: "1px solid #2a3040" },
  receiptHeader: { textAlign: "center", marginBottom: 16 },
  receiptLogo: { display: "block", fontSize: 20, fontWeight: 800, color: "#f59e0b" },
  receiptSub: { fontSize: 12, color: "#64748b", marginTop: 4 },
  receiptDivider: { height: 1, background: "#2a3040", margin: "12px 0" },
  receiptRow: { display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, color: "#e2e8f0" },
  receiptClose: { width: "100%", marginTop: 20, background: "#f59e0b", border: "none", borderRadius: 12, color: "#0f1623", fontWeight: 800, fontSize: 15, padding: "14px", cursor: "pointer" },
};
