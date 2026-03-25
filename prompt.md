Create a modern, responsive **frontend-only website** for a coffee shop named **"Warcoop"**. This project focuses only on the **customer-facing UI** and uses **dummy data (no backend integration)**.

### General Requirements

- No navbar is used
- Global layout uses **horizontal padding of 40px**
- Clean, modern UI with a slightly playful coffee shop vibe
- Use **rounded corners** consistently
- Mobile-first and fully responsive design
- Use reusable components where possible

---

### Page Structure

#### 1. Hero Section

- A **discount banner card**
- Background color: **#D31319 (red)**
- Rounded corners (large radius)
- Contains:
  - Promo text (e.g., “Discount up to 50%”)
  - Optional small subtitle

- Should feel bold and eye-catching

---

#### 2. Search Bar

- Positioned directly below the hero
- Full width input with rounded edges
- Placeholder text: “Search menu…”
- Include search icon inside input

---

#### 3. Category Tabs

- Horizontal scrollable tabs (especially on mobile)
- Each tab represents a category (e.g., Coffee, Non-Coffee, Snacks, Meals)
- Show **category name + total items**
  - Example: “Coffee (12)”

- Active tab:
  - Highlighted (different background or underline)
  - Smooth transition when switching

---

#### 4. Product Gallery

- Displays items based on selected tab
- Grid layout (responsive):
  - Mobile: 1–2 columns
  - Desktop: 3–4 columns

##### Product Card Design:

- Rounded border container
- Layout: **flex row**
  - Left: product image (fixed size, rounded)
  - Right:
    - Product name (bold)
    - Price
    - Optional short description (light text)

- Include **badge/tag** on item:
  - Examples: “Popular”, “Best Seller”, “New”
  - Positioned on image (top corner)

- Add subtle shadow and hover effect (for desktop)

---

### Dummy Data

Include sample data for:

- Categories
- Products (name, price, image, category, badge)

---

### Tech Stack (if applicable)

- React / Next.js
- TailwindCSS
- Component-based structure

---

### UX Details

- Smooth transitions between tabs
- Skeleton/loading state (optional for realism)
- Empty state for search (no results found)
- Consistent spacing and alignment

---

### Goal

Create a **clean, modern, and visually appealing food ordering interface** that feels like a real product, even without backend functionality.

---

### V2 Features (Cart + Variants + Checkout)

#### Cart
- When the cart is closed, show a floating “cart” icon button.
- When the cart is opened, show a right-side drawer with cart items.
- The cart drawer supports quantity increment/decrement per line item.
- The cart drawer includes a “Checkout” action that navigates to `/checkout`.

#### Detail Product (Modal)
- Tapping/clicking a product card opens a product detail modal (no route change).
- The modal displays the product image, name, base price, description (optional), and badges (optional).

#### Product Add Counter
- Inside the product detail modal, include `+ / -` quantity controls (quantity starts at 1).
- “Add to cart” adds the selected product with the selected quantity.

#### Product Variant (Multi-Group)
- Each product can define multiple variant groups.
- Users must select one option per group (defaults to the first option when the modal opens).
- The displayed total price is `unit price (base + selected deltas) * quantity`.
- Add-to-cart uses the selected option ids to create a unique cart line.

#### Checkout Page
- `/checkout` shows a dummy checkout screen with:
  - cart summary (items, selections, totals)
  - dummy form fields (name/email/payment)
  - a “Place order” button that clears the cart (no backend).

---

### V3 Features (Success, Load UX, Filters, Checkout)

#### Order success + confetti
- After a valid checkout submit, navigate to `/order-success`.
- Show a success message and run a **confetti** animation once on mount (respect `prefers-reduced-motion: reduce` — skip or reduce motion).

#### Skeleton and cache (first load only)
- Show the product grid **skeleton only on the first load** of the menu (initial mount), to simulate fetching data.
- After the first load completes, **switching category tabs must not** show the skeleton again until the page is refreshed.
- Keep an **in-memory cache** of products grouped by category for the session (derived once from dummy data).

#### Product filters (expandable)
- Next to the search field (right side), show a **filter icon** button.
- When clicked, expand a panel **below the search** with:
  - **Sort**: name A–Z / Z–A, price low→high / high→low
  - **Badge**: All, Popular, Best Seller, New, Hot, Limited
  - **Price (base price)**: All, under Rp 25k, Rp 25k–40k, above Rp 40k
- Filters combine with search and the active category tab.
- If search returns items but filters hide everything, show an empty state with **Clear filters**.

#### Checkout form (required)
- **No address field**; use **email** instead.
- **Name**, **email**, and **payment** are required; validate email format before allowing submit.
- Successful submit clears the cart and goes to the success page (dummy — no backend).
