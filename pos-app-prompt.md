Create a modern **Admin Dashboard / POS UI (frontend-only)** for a coffee shop platform called **"Warcoop"**.

⚠️ Focus ONLY on UI/UX (no backend, no database).
Use **dummy/static data** and local state to simulate interactions.

---

## 🎯 Goal

Build a **clean, scalable, and realistic POS dashboard UI** that is easy to extend into a fullstack app later.

---

## ⚙️ Tech Stack (MANDATORY)

- React (Vite)
- TailwindCSS
- Feature-based folder structure (important)

---

## 🧱 Project Structure (IMPORTANT)

Use **feature-based architecture** instead of page-based:

Example:

```
src/
  features/
    dashboard/
    categories/
    products/
    orders/
    transactions/
    outstanding/
  components/
    ui/ (reusable components: button, card, badge)
    layout/ (navbar, container)
  data/
    dummyData.js
  hooks/
  utils/
  App.jsx
```

Each feature should contain:

- components/
- pages/
- hooks/ (optional)
- local state logic (UI simulation only)

---

## 🧱 Global Layout

### Structure:

- Sticky **Top Navbar**
- Main content below
- No sidebar

---

### 🔝 Navbar

Menu:

- Dashboard
- Categories
- Products
- Orders
- Transactions
- Outstanding

#### Design:

- Active menu highlight
- Right side:
  - “Warcoop - Demo”
  - Role (Owner/Kasir)

- Responsive (scrollable on mobile)

---

## 📦 Pages (UI Only)

### 1. Dashboard

- Summary cards:
  - Revenue
  - Orders
  - Active Orders
  - Low Stock

- Chart (dummy/static)
- Recent transactions

---

### 2. Categories

- List categories
- Show item count
- Add/Edit/Delete (UI only)

---

### 3. Products

- Grid or table
- Show:
  - Name
  - Price
  - Stock
  - Category

- Low stock indicator
- Add/Edit/Delete (UI simulation)

---

### 4. Orders (POS Simulation)

- Order list with status:
  - pending, preparing, served, completed, cancelled

#### Create Order:

- Modal / drawer
- Select products
- Add quantity
- Cart summary (dynamic)
- Input:
  - Table number
  - Customer name

---

### 5. Transactions

- List all payments
- Fields:
  - Payment method (cash/qris/bon)
  - Amount
  - Change

- Status badge (Paid / Unpaid)

---

### 6. Outstanding (Debt / BON)

- List unpaid transactions
- Show:
  - Customer name
  - Amount
  - Due date

- “Mark as Paid” button (UI only)

---

## 🧩 Dummy Data

Create realistic dummy data:

- Categories
- Products (with stock & badges)
- Orders
- Transactions
- Debt

Simulate:

- Low stock items
- Active orders
- Unpaid debts

---

## 🎨 UI/UX Style

- Modern POS dashboard (clean, minimal)
- Rounded cards (xl)
- Soft shadows
- Spacious layout (padding 24–40px)

### Colors:

- Base: white / gray
- Green → success
- Yellow → pending
- Red → alert / debt

---

## 💡 UX Details

- Modal / drawer interactions
- Smooth transitions
- Hover effects
- Empty states
- Optional loading skeleton

---

## 🧠 Architecture Notes

- Use reusable UI components (Button, Card, Badge)
- Keep state local (useState / context if needed)
- Separate logic per feature (scalable for backend later)
- Avoid tight coupling between features

---

## 🚀 Expected Output

- Fully working UI (not just static layout)
- Feature-based structure implemented
- Clean and maintainable code
- Ready to integrate with backend in future
