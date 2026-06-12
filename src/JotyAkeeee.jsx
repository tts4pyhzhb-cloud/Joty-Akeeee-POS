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
