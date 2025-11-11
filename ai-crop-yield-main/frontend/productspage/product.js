(function () {
  // ---------------- Firebase Setup ----------------
  const firebaseConfig = {
    apiKey: "AIzaSyBSJeV-gOAVd-ARx8zS3nZCFDqHyZRdPt8",
    authDomain: "agri-tech-df7bf.firebaseapp.com",
    projectId: "agri-tech-df7bf",
    storageBucket: "agri-tech-df7bf.firebasestorage.app",
    messagingSenderId: "241146284207",
    appId: "1:241146284207:web:c9451239ba8da379c92c5a",
    measurementId: "G-C9XMZWX4RG"
  };

  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();

  // ---------------- Globals ----------------
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  const products = [
    { id: 1, name: "Tomato Seeds", price: 3.5, img: "products/tomatoseed.png", rating: 4.5, desc: "High-quality tomato seeds for healthy yield.", category: "Seeds" },
    { id: 5, name: "Corn Seeds", price: 4.5, img: "products/cornseeds.png", rating: 4.2, desc: "Premium hybrid corn seeds for high yield.", category: "Seeds" },
    { id: 2, name: "Organic Fertilizer", price: 12.99, img: "products/compost.png", rating: 4.8, desc: "Eco-friendly organic compost fertilizer.", category: "Fertilizers" },
    { id: 8, name: "Potting Soil", price: 8, img: "products/pottingsoil.png", rating: 4.1, desc: "Nutrient-rich potting soil for plants.", category: "Fertilizers" },
    { id: 3, name: "Shovel Tool", price: 18.5, img: "products/tools.jpg", rating: 4.3, desc: "Durable steel shovel for farming and gardening.", category: "Tools" },
    { id: 4, name: "Watering Can", price: 15, img: "products/watercan.png", rating: 4.6, desc: "Ergonomic watering can for easy irrigation.", category: "Tools" },
    { id: 6, name: "Hand Hoe", price: 10, img: "products/handhoe.png", rating: 4.4, desc: "Lightweight hand hoe for easy weeding.", category: "Tools" },
    { id: 7, name: "Sprayer Pump", price: 25, img: "products/sprayer.png", rating: 4.7, desc: "Pressure sprayer for fertilizers and pesticides.", category: "Tools" },
    { id: 9, name: "Rice Seeds", price: 5, img: "products/riceseeds.png", rating: 4.3, desc: "High-quality rice seeds for abundant harvests.", category: "Seeds" },
    { id: 10, name: "Soybean Seeds", price: 6, img: "products/soybean.png", rating: 4.4, desc: "Premium soybean seeds for protein-rich crops.", category: "Seeds" },
    { id: 11, name: "NPK Fertilizer", price: 14.5, img: "products/npk.png", rating: 4.6, desc: "Balanced NPK fertilizer for complete crop nutrition.", category: "Fertilizers" },
    { id: 12, name: "Urea Fertilizer", price: 9.5, img: "products/urea.png", rating: 4.5, desc: "Nitrogen-rich urea fertilizer for rapid plant growth.", category: "Fertilizers" }
  ];

  // ---------------- Helpers ----------------
  const showToast = (msg, type = "success") => {
    const container = document.getElementById("toastContainer") || (() => {
      const div = document.createElement("div");
      div.id = "toastContainer";
      div.className = "toast-container position-fixed top-0 end-0 p-3";
      document.body.appendChild(div);
      return div;
    })();
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${type} border-0 show`;
    toast.role = "alert";
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const renderRating = (r) => "★".repeat(Math.floor(r)) + (r % 1 >= 0.5 ? "½" : "");

  // ---------------- Product Render ----------------
  const renderProducts = (listData = products) => {
    const list = document.getElementById("productList");
    if (!list) return;
    list.innerHTML = "";
    listData.forEach(p => {
      const liked = wishlist.some(w => w.id === p.id);
      const col = document.createElement("div");
      col.className = "col-sm-6 col-md-4 col-lg-3";
      col.innerHTML = `
        <div class="product-card shadow rounded text-center">
          <img src="${p.img}" class="product-img" alt="${p.name}">
          <h6 class="mt-2">${p.name}</h6>
          <div class="d-flex justify-content-between align-items-center">
            <span>$${p.price.toFixed(2)}</span>
            <span class="rating text-warning">${renderRating(p.rating)}</span>
          </div>
          <div class="mt-2 d-flex gap-1 flex-wrap m-3">
            <button class="btn btn-sm btn-success" data-id="${p.id}"><i class="bi bi-cart-plus"></i></button>
            <button class="btn btn-sm ${liked ? "btn-danger" : "btn-outline-danger"}" data-like-id="${p.id}">
              <i class="bi bi-heart${liked ? "-fill" : ""}"></i>
            </button>
            <button class="btn btn-sm btn-info text-white" data-details-id="${p.id}">
              <i class="bi bi-info-circle"></i>
            </button>
          </div>
        </div>`;
      list.appendChild(col);
    });

    list.querySelectorAll("button[data-id]").forEach(btn => btn.onclick = () => addToCart(Number(btn.dataset.id)));
    list.querySelectorAll("button[data-like-id]").forEach(btn => btn.onclick = () => toggleWishlist(Number(btn.dataset.likeId)));
    list.querySelectorAll("button[data-details-id]").forEach(btn => btn.onclick = () => showDetails(Number(btn.dataset.detailsId)));
  };

  // ---------------- Cart / Wishlist Functions ----------------
  const renderCart = () => {
    const list = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotalDrawer");
    const countNav = document.getElementById("cartCount");
    if (!list) return;
    list.innerHTML = "";
    let total = 0;
    cart.forEach(p => {
      total += p.price * p.qty;
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>${p.name} <small>$${p.price} x ${p.qty}</small></div>
        <span>$${(p.price * p.qty).toFixed(2)}</span>`;
      list.appendChild(li);
    });
    totalEl.textContent = "$" + total.toFixed(2);
    if (countNav) countNav.textContent = cart.reduce((s, c) => s + c.qty, 0);
  };

  const addToCart = (id) => {
    const p = products.find(x => x.id === id); if (!p) return;
    const existing = cart.find(c => c.id === id);
    if (existing) existing.qty++; else cart.push({ ...p, qty: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    showToast(`${p.name} added to cart!`);
  };

  const toggleWishlist = (id) => {
    const idx = wishlist.findIndex(w => w.id === id);
    if (idx > -1) wishlist.splice(idx, 1);
    else wishlist.push(products.find(x => x.id === id));
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    renderProducts();
  };

  // ---------------- Firebase Auth ----------------
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authModalLabel = document.getElementById("authModalLabel");
  const toggleAuth = document.getElementById("toggleAuth");

  const switchToRegister = () => {
    loginForm.classList.add("d-none");
    registerForm.classList.remove("d-none");
    authModalLabel.textContent = "Register";
    toggleAuth.innerHTML = 'Already have an account? <a href="#" id="showLogin">Login</a>';
    document.getElementById("showLogin").onclick = (e) => { e.preventDefault(); switchToLogin(); };
  };

  const switchToLogin = () => {
    loginForm.classList.remove("d-none");
    registerForm.classList.add("d-none");
    authModalLabel.textContent = "Login";
    toggleAuth.innerHTML = 'Don’t have an account? <a href="#" id="showRegister">Register</a>';
    document.getElementById("showRegister").onclick = (e) => { e.preventDefault(); switchToRegister(); };
  };

  // Firebase Register
  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById("registerName").value;
      const email = document.getElementById("registerEmail").value;
      const pwd = document.getElementById("registerPassword").value;

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pwd);
        await userCredential.user.updateProfile({ displayName: name });
        showToast("Registered successfully! You can login now");
        switchToLogin();
      } catch (error) {
        showToast(error.message, "danger");
      }
    };
  }

  // Firebase Login
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const pwd = document.getElementById("loginPassword").value;

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, pwd);
        const user = userCredential.user;
        showToast("Login successful!");
        const authModal = bootstrap.Modal.getInstance(document.getElementById("authModal"));
        authModal.hide();
        updateUserUI(user);
      } catch (error) {
        showToast("Invalid credentials: " + error.message, "danger");
      }
    };
  }

  // Track user login/logout
  auth.onAuthStateChanged((user) => {
    updateUserUI(user);
  });

  function updateUserUI(user) {
    const userSection = document.getElementById("userSection");
    if (user) {
      userSection.innerHTML = `<span class="text-light me-2">Hi, ${user.displayName || user.email}</span>
      <button class="btn btn-outline-light btn-sm" id="logoutBtn">Logout</button>`;
      document.getElementById("logoutBtn").onclick = () => auth.signOut();
    } else {
      userSection.innerHTML = `<button class="btn btn-outline-light btn-sm" data-bs-toggle="modal" data-bs-target="#authModal"><i class="bi bi-person-circle"></i> Login</button>`;
    }
  }

  // ---------------- Init ----------------
  document.addEventListener("DOMContentLoaded", () => {
    renderProducts();
    renderCart();
  });
})();
