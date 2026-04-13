const state = {
  products: [],
  categories: [],
  cart: loadCart(),
  filters: {
    search: "",
    category: "all"
  },
  latestOrder: null
};

const elements = {
  productGrid: document.querySelector("#product-grid"),
  catalogStatus: document.querySelector("#catalog-status"),
  categoryFilter: document.querySelector("#category-filter"),
  searchInput: document.querySelector("#search-input"),
  cartItems: document.querySelector("#cart-items"),
  cartTitle: document.querySelector("#cart-title"),
  cartTotal: document.querySelector("#cart-total"),
  checkoutForm: document.querySelector("#checkout-form"),
  checkoutButton: document.querySelector("#checkout-button"),
  checkoutMessage: document.querySelector("#checkout-message"),
  ordersList: document.querySelector("#orders-list"),
  latestOrder: document.querySelector("#latest-order"),
  productTemplate: document.querySelector("#product-card-template")
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function loadCart() {
  try {
    const saved = localStorage.getItem("northstar-cart");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("northstar-cart", JSON.stringify(state.cart));
}

function getCartItemCount() {
  return state.cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
  return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function setCheckoutMessage(message, isError = false) {
  elements.checkoutMessage.textContent = message;
  elements.checkoutMessage.style.color = isError ? "#9f2c13" : "#1c7f55";
}

function renderCategoryOptions() {
  const currentValue = state.filters.category;
  const options = ['<option value="all">All categories</option>']
    .concat(
      state.categories.map(
        (category) => `<option value="${category}">${category}</option>`
      )
    )
    .join("");

  elements.categoryFilter.innerHTML = options;
  elements.categoryFilter.value = currentValue;
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);

  if (!product || product.inventory < 1) {
    return;
  }

  const existing = state.cart.find((item) => item.productId === productId);

  if (existing) {
    if (existing.quantity >= product.inventory) {
      setCheckoutMessage("You have reached available stock for that product.", true);
      return;
    }

    existing.quantity += 1;
  } else {
    state.cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  setCheckoutMessage("");
}

function updateCartItem(productId, delta) {
  const cartItem = state.cart.find((item) => item.productId === productId);
  const product = state.products.find((item) => item.id === productId);

  if (!cartItem || !product) {
    return;
  }

  const nextQuantity = cartItem.quantity + delta;

  if (nextQuantity < 1) {
    state.cart = state.cart.filter((item) => item.productId !== productId);
  } else if (nextQuantity <= product.inventory) {
    cartItem.quantity = nextQuantity;
  }

  saveCart();
  renderCart();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter((item) => item.productId !== productId);
  saveCart();
  renderCart();
}

function renderCart() {
  const itemCount = getCartItemCount();
  elements.cartTitle.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  elements.cartTotal.textContent = formatCurrency(getCartTotal());

  if (!state.cart.length) {
    elements.cartItems.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
    return;
  }

  elements.cartItems.innerHTML = state.cart
    .map(
      (item) => `
        <article class="cart-row">
          <div class="cart-row-top">
            <div>
              <h4>${item.name}</h4>
              <p class="muted">${formatCurrency(item.price)} each</p>
            </div>
            <strong>${formatCurrency(item.price * item.quantity)}</strong>
          </div>
          <div class="cart-actions">
            <button class="qty-button" type="button" data-action="decrease" data-product-id="${item.productId}">-</button>
            <span>${item.quantity}</span>
            <button class="qty-button" type="button" data-action="increase" data-product-id="${item.productId}">+</button>
            <button class="remove-button" type="button" data-action="remove" data-product-id="${item.productId}">Remove</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderProducts() {
  if (!state.products.length) {
    elements.catalogStatus.textContent = "No products match your current filters.";
    elements.productGrid.innerHTML = "";
    return;
  }

  elements.catalogStatus.textContent = `${state.products.length} products available`;
  elements.productGrid.innerHTML = "";

  for (const product of state.products) {
    const fragment = elements.productTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".product-card");
    const image = fragment.querySelector(".product-image");
    const categoryTag = fragment.querySelector(".category-tag");
    const inventoryTag = fragment.querySelector(".inventory-tag");
    const name = fragment.querySelector(".product-name");
    const description = fragment.querySelector(".product-description");
    const price = fragment.querySelector(".product-price");
    const button = fragment.querySelector(".add-button");

    image.src = product.imageUrl;
    image.alt = product.name;
    categoryTag.textContent = product.category;
    inventoryTag.textContent =
      product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock";
    name.textContent = product.name;
    description.textContent = product.shortDescription;
    price.textContent = formatCurrency(product.price);
    button.dataset.productId = String(product.id);

    if (product.inventory < 1) {
      button.disabled = true;
      button.textContent = "Unavailable";
      button.style.opacity = "0.5";
    }

    elements.productGrid.appendChild(fragment);
  }
}

function renderLatestOrder() {
  if (!state.latestOrder) {
    elements.latestOrder.hidden = true;
    elements.latestOrder.innerHTML = "";
    return;
  }

  elements.latestOrder.hidden = false;
  elements.latestOrder.innerHTML = `
    <p class="eyebrow">Latest order</p>
    <div class="order-card-top">
      <h3>Order #${state.latestOrder.id}</h3>
      <span class="status-pill">${state.latestOrder.status}</span>
    </div>
    <p class="muted">
      ${state.latestOrder.customerName} placed an order for
      ${formatCurrency(state.latestOrder.totalAmount)}.
    </p>
  `;
}

function renderOrders(orders) {
  if (!orders.length) {
    elements.ordersList.innerHTML = '<p class="empty-state">No orders yet.</p>';
    return;
  }

  elements.ordersList.innerHTML = orders
    .map(
      (order) => `
        <article class="order-card">
          <div class="order-card-top">
            <h3>Order #${order.id}</h3>
            <span class="status-pill">${order.status}</span>
          </div>
          <div class="order-meta">
            <span>${order.customerName}</span>
            <strong>${formatCurrency(order.totalAmount)}</strong>
          </div>
          <p class="muted">${order.itemCount} item(s) · ${new Date(order.createdAt).toLocaleString()}</p>
        </article>
      `
    )
    .join("");
}

async function fetchProducts() {
  elements.catalogStatus.textContent = "Loading products...";

  const params = new URLSearchParams();

  if (state.filters.search) {
    params.set("search", state.filters.search);
  }

  if (state.filters.category && state.filters.category !== "all") {
    params.set("category", state.filters.category);
  }

  const query = params.toString();
  const response = await fetch(query ? `/api/products?${query}` : "/api/products");
  if (!response.ok) {
    throw new Error("Failed to load products.");
  }
  const data = await response.json();

  state.products = data.products || [];
  state.categories = data.categories || [];
  renderCategoryOptions();
  renderProducts();
}

async function fetchOrders() {
  const response = await fetch("/api/orders");
  if (!response.ok) {
    throw new Error("Failed to load orders.");
  }
  const data = await response.json();
  renderOrders(data.orders || []);
}

async function submitCheckout(event) {
  event.preventDefault();

  if (!state.cart.length) {
    setCheckoutMessage("Add at least one item before checking out.", true);
    return;
  }

  elements.checkoutButton.disabled = true;
  setCheckoutMessage("Placing your order...");

  const formData = new FormData(elements.checkoutForm);
  const payload = {
    customerName: String(formData.get("customerName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    items: state.cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  };

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Checkout failed.");
    }

    state.latestOrder = data.order;
    state.cart = [];
    saveCart();
    renderLatestOrder();
    renderCart();
    elements.checkoutForm.reset();
    setCheckoutMessage(`Order #${data.order.id} placed successfully.`);
    await Promise.all([fetchProducts(), fetchOrders()]);
  } catch (error) {
    setCheckoutMessage(error.message, true);
  } finally {
    elements.checkoutButton.disabled = false;
  }
}

function bindEvents() {
  elements.searchInput.addEventListener("input", async (event) => {
    state.filters.search = event.target.value.trim();
    await fetchProducts();
  });

  elements.categoryFilter.addEventListener("change", async (event) => {
    state.filters.category = event.target.value;
    await fetchProducts();
  });

  elements.checkoutForm.addEventListener("submit", submitCheckout);

  elements.cartItems.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-action]");

    if (!target) {
      return;
    }

    const productId = Number(target.dataset.productId);
    const action = target.dataset.action;

    if (action === "increase") {
      updateCartItem(productId, 1);
    } else if (action === "decrease") {
      updateCartItem(productId, -1);
    } else if (action === "remove") {
      removeCartItem(productId);
    }
  });

  elements.productGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".add-button[data-product-id]");

    if (!button) {
      return;
    }

    addToCart(Number(button.dataset.productId));
  });
}

async function init() {
  bindEvents();
  renderCart();
  renderLatestOrder();

  try {
    await Promise.all([fetchProducts(), fetchOrders()]);
  } catch (error) {
    elements.catalogStatus.textContent = "Failed to load products.";
    setCheckoutMessage("The API is unavailable. Check the server logs.", true);
  }
}

init();
