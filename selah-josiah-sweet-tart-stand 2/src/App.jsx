import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Trash2, RotateCcw, Plus, Minus, Receipt, Heart } from "lucide-react";
import "./styles.css";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxL869pO5cQ0yAl2cWSBvvP07zjCTL7SzJ-qpeQZ5OYwNA_zMx4J2GubdOhYV0m5ORb/exec";

const PRODUCTS = [
  { id: "small", name: "Small Lemonade", price: 1, emoji: "🥤" },
  { id: "large", name: "Large Lemonade", price: 2, emoji: "🍋" },
  { id: "straw", name: "Candy Straw", price: 1, emoji: "🍬" },
  { id: "cookie", name: "Cookie", price: 1, emoji: "🍪" },
];

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

function App() {
  const [cart, setCart] = useState({ small: 0, large: 0, straw: 0, cookie: 0 });
  const [tip, setTip] = useState(0);
  const [donation, setDonation] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactions, setTransactions] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [activeMoneyField, setActiveMoneyField] = useState(null);

  const getMoneyFieldValue = (field) => {
    if (field === "tip") return tip;
    if (field === "donation") return donation;
    if (field === "cash") return cashReceived;
    return 0;
  };

  const setMoneyFieldValue = (field, value) => {
    if (field === "tip") setTip(value);
    if (field === "donation") setDonation(value);
    if (field === "cash") setCashReceived(value);
  };

  const appendNumberPadValue = (value) => {
    if (!activeMoneyField) return;
    const current = String(getMoneyFieldValue(activeMoneyField) || "");
    if (value === "." && current.includes(".")) return;
    const next = current === "0" && value !== "." ? value : `${current}${value}`;
    setMoneyFieldValue(activeMoneyField, next);
  };

  const backspaceNumberPadValue = () => {
    if (!activeMoneyField) return;
    const current = String(getMoneyFieldValue(activeMoneyField) || "");
    const next = current.slice(0, -1);
    setMoneyFieldValue(activeMoneyField, next || 0);
  };

  const clearNumberPadValue = () => {
    if (!activeMoneyField) return;
    setMoneyFieldValue(activeMoneyField, 0);
  };

  const itemsTotal = useMemo(() => {
    return PRODUCTS.reduce((sum, item) => sum + cart[item.id] * item.price, 0);
  }, [cart]);

  const grandTotal = useMemo(
    () => itemsTotal + Number(tip || 0) + Number(donation || 0),
    [itemsTotal, tip, donation]
  );

  const changeDue = Math.max(Number(cashReceived || 0) - grandTotal, 0);
  const amountStillDue = Math.max(grandTotal - Number(cashReceived || 0), 0);

  const addItem = (id) => setCart((current) => ({ ...current, [id]: current[id] + 1 }));
  const removeItem = (id) =>
    setCart((current) => ({ ...current, [id]: Math.max(current[id] - 1, 0) }));

  const resetOrder = () => {
    setCart({ small: 0, large: 0, straw: 0, cookie: 0 });
    setTip(0);
    setDonation(0);
    setCashReceived(0);
    setPaymentMethod("Cash");
    setSaveStatus("");
  };

  const saveTransaction = async () => {
    if (grandTotal <= 0) return;

    const orderItems = PRODUCTS
      .filter((item) => cart[item.id] > 0)
      .map((item) => `${cart[item.id]} ${item.name}`)
      .join(", ");

    const transaction = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      order: orderItems || "Donation/Tip only",
      itemsTotal,
      tip: Number(tip || 0),
      donation: Number(donation || 0),
      total: grandTotal,
      paymentMethod,
      cashReceived: paymentMethod === "Cash" ? Number(cashReceived || 0) : grandTotal,
      changeDue: paymentMethod === "Cash" ? changeDue : 0,
    };

    setTransactions((current) => [transaction, ...current]);

    try {
      setSaveStatus("Saving to Google...");
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      setSaveStatus("Saved to Google");
    } catch (error) {
      setSaveStatus("Saved on this device, but Google sync failed");
    }

    setCart({ small: 0, large: 0, straw: 0, cookie: 0 });
    setTip(0);
    setDonation(0);
    setCashReceived(0);
    setPaymentMethod("Cash");
  };

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => ({
        sales: acc.sales + tx.itemsTotal,
        tips: acc.tips + tx.tip,
        donations: acc.donations + tx.donation,
        total: acc.total + tx.total,
      }),
      { sales: 0, tips: 0, donations: 0, total: 0 }
    );
  }, [transactions]);

  const challengeGoal = 200;
  const challengeProgress = Math.min((totals.donations / challengeGoal) * 100, 100);
  const challengeDonorEquivalent = Math.floor(totals.donations / 10);

  return (
    <div className="app-shell">
      <div className="container">
        <header className="hero">
          <div>
            <p className="eyebrow">Lemonade Stand Checkout</p>
            <h1>Selah & Josiah’s Sweet and Tart Stand</h1>
          </div>
          <div className="badge">🍋 Kid-friendly register</div>
        </header>

        <main className="layout">
          <section className="product-grid">
            {PRODUCTS.map((item) => (
              <div key={item.id} className="card product-card">
                <div className="product-top">
                  <div>
                    <div className="emoji">{item.emoji}</div>
                    <h2>{item.name}</h2>
                    <p className="price">{money(item.price)}</p>
                  </div>
                  <div className="quantity">{cart[item.id]}</div>
                </div>
                <div className="button-grid">
                  <button
                    className="btn outline"
                    onClick={() => removeItem(item.id)}
                    disabled={cart[item.id] === 0}
                  >
                    <Minus size={22} /> Remove
                  </button>
                  <button className="btn yellow" onClick={() => addItem(item.id)}>
                    <Plus size={22} /> Add
                  </button>
                </div>
              </div>
            ))}
          </section>

          <aside className="sidebar">
            <div className="card checkout">
              <h2 className="section-title"><Receipt size={28} /> Current Order</h2>

              <div className="order-box">
                {PRODUCTS.map((item) => (
                  <div key={item.id} className="line-item">
                    <span>{item.name} x {cart[item.id]}</span>
                    <strong>{money(cart[item.id] * item.price)}</strong>
                  </div>
                ))}
                <div className="line-item subtotal">
                  <span>Items subtotal</span>
                  <strong>{money(itemsTotal)}</strong>
                </div>
              </div>

              <div className="field-grid">
                <label>
                  <span>Tip</span>
                  <button
                    type="button"
                    className={`money-display ${activeMoneyField === "tip" ? "active" : ""}`}
                    onClick={() => setActiveMoneyField("tip")}
                  >
                    {money(tip)}
                  </button>
                </label>
                <label>
                  <span>Still Water Donation</span>
                  <button
                    type="button"
                    className={`money-display ${activeMoneyField === "donation" ? "active" : ""}`}
                    onClick={() => setActiveMoneyField("donation")}
                  >
                    {money(donation)}
                  </button>
                </label>
              </div>

              <div>
                <span className="label-title">Payment Method</span>
                <div className="payment-grid">
                  <button
                    className={`btn ${paymentMethod === "Cash" ? "green" : "outline"}`}
                    onClick={() => setPaymentMethod("Cash")}
                  >
                    💵 Cash
                  </button>
                  <button
                    className={`btn ${paymentMethod === "Venmo" ? "blue" : "outline"}`}
                    onClick={() => setPaymentMethod("Venmo")}
                  >
                    📱 Venmo
                  </button>
                </div>
              </div>

              {paymentMethod === "Cash" ? (
                <label>
                  <span>Cash Received</span>
                  <button
                    type="button"
                    className={`money-display cash-display ${activeMoneyField === "cash" ? "active" : ""}`}
                    onClick={() => setActiveMoneyField("cash")}
                  >
                    {money(cashReceived)}
                  </button>
                </label>
              ) : (
                <div className="venmo-box">
                  <p>Venmo Selected</p>
                  <strong>Collect {money(grandTotal)} in Venmo</strong>
                </div>
              )}

              {activeMoneyField && (
                <div className="number-pad">
                  <p>
                    Enter {activeMoneyField === "tip" ? "Tip" : activeMoneyField === "donation" ? "Still Water Donation" : "Cash Received"}
                  </p>
                  <div className="number-pad-grid">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => (
                      <button key={key} type="button" className="number-key" onClick={() => appendNumberPadValue(key)}>
                        {key}
                      </button>
                    ))}
                    <button type="button" className="number-key" onClick={backspaceNumberPadValue}>⌫</button>
                  </div>
                  <div className="number-pad-actions">
                    <button type="button" className="btn outline" onClick={clearNumberPadValue}>Clear</button>
                    <button type="button" className="btn green" onClick={() => setActiveMoneyField(null)}>Done</button>
                  </div>
                </div>
              )}

              <div className="total-box">
                <div className="line-item total-line">
                  <span>Total</span>
                  <span>{money(grandTotal)}</span>
                </div>
                <div className="line-item change-line">
                  <span>
                    {paymentMethod === "Cash"
                      ? amountStillDue > 0
                        ? "Still Due"
                        : "Change Due"
                      : "Venmo Total"}
                  </span>
                  <span>
                    {paymentMethod === "Cash"
                      ? amountStillDue > 0
                        ? money(amountStillDue)
                        : money(changeDue)
                      : money(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="button-grid">
                <button className="btn outline" onClick={resetOrder}>
                  <RotateCcw size={22} /> Clear
                </button>
                <button className="btn green" onClick={saveTransaction} disabled={grandTotal <= 0}>
                  Save Sale
                </button>
              </div>

              {saveStatus && <p className="status">{saveStatus}</p>}
            </div>

            <div className="card">
              <h2 className="section-title"><Heart size={28} /> Total Raised Today</h2>

              <div className="raised-box">
                <p>Sales + Tips + Still Water Donations</p>
                <strong>{money(totals.total)}</strong>
              </div>

              <div className="challenge-box">
                <div className="challenge-header">
                  <div>
                    <p className="challenge-title">10/20 Challenge</p>
                    <p className="challenge-subtitle">20 people giving $10 to Still Water</p>
                  </div>
                  <strong>{money(totals.donations)} / {money(challengeGoal)}</strong>
                </div>

                <div className="thermometer-track">
                  <div className="thermometer-fill" style={{ width: `${challengeProgress}%` }} />
                </div>

                <p className="challenge-footer">
                  About {challengeDonorEquivalent} of 20 gifts reached
                </p>
              </div>

              <div className="totals-grid">
                <div><p>Sales</p><strong>{money(totals.sales)}</strong></div>
                <div><p>Tips</p><strong>{money(totals.tips)}</strong></div>
                <div><p>Donations</p><strong>{money(totals.donations)}</strong></div>
                <div><p>Grand Total</p><strong>{money(totals.total)}</strong></div>
              </div>
            </div>
          </aside>
        </main>

        <section className="card log-card">
          <div className="log-header">
            <h2>Transaction Log</h2>
            <button className="btn outline small" onClick={() => setTransactions([])} disabled={transactions.length === 0}>
              <Trash2 size={18} /> Clear Log
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="empty">No sales saved yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Order</th>
                    <th>Tip</th>
                    <th>Donation</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Cash</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.time}</td>
                      <td>{tx.order}</td>
                      <td>{money(tx.tip)}</td>
                      <td>{money(tx.donation)}</td>
                      <td><strong>{money(tx.total)}</strong></td>
                      <td>{tx.paymentMethod}</td>
                      <td>{tx.paymentMethod === "Venmo" ? "—" : money(tx.cashReceived)}</td>
                      <td>{tx.paymentMethod === "Venmo" ? "—" : money(tx.changeDue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
