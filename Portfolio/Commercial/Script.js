gsap.registerPlugin(ScrollTrigger);

function getTargetPositions() {
    const bshape = document.querySelector("#bshape");
    const featuredCard = document.querySelector(".featured-card");

    const bshapeRect = bshape.getBoundingClientRect();
    const cardRect = featuredCard.getBoundingClientRect();
    const scrollY = window.scrollY;

    const pedestalCenterX = bshapeRect.left + bshapeRect.width / 2;
    const pedestalTopY = bshapeRect.top + scrollY;

    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardTopY = cardRect.top + scrollY;

    return {
        fantaSec2Left: pedestalCenterX - (window.innerWidth * 0.13),
        fantaSec2Top: pedestalTopY - 260,
        sliceSec2Left: pedestalCenterX - 40,
        sliceSec2Top: pedestalTopY - 120,
        fantaSec3Left: cardCenterX - 105,
        fantaSec3Top: cardTopY + 35,
        sliceSec3Left: cardCenterX - 82.5,
        sliceSec3Top: cardTopY - 65
    };
}

// Run full coordinate scroll choreography on Desktop (>900px) using gsap.matchMedia()
let mm = gsap.matchMedia();

mm.add("(min-width: 901px)", () => {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".two",
            start: "0% 95%",
            end: "70% 50%",
            scrub: true,
            invalidateOnRefresh: true
        }
    });

    tl.to("#Fanta", {
        top: () => getTargetPositions().fantaSec2Top + "px",
        left: () => getTargetPositions().fantaSec2Left + "px",
        width: "26vw",
        scale: 1
    }, "orange")
    .to("#slice", {
        top: () => getTargetPositions().sliceSec2Top + "px",
        left: () => getTargetPositions().sliceSec2Left + "px",
        scale: 1
    }, "orange")
    .to("#orange", {
        top: "162%",
        left: "76%",
        width: "16vw"
    }, "orange")
    .to("#twoleaf", {
        top: "112%",
        left: "6%",
        rotate: "130deg"
    }, "orange")
    .to("#leaf", {
        top: "110%",
        left: "82%",
        rotate: "250deg"
    }, "orange");

    const tl2 = gsap.timeline({
        scrollTrigger: {
            trigger: ".three",
            start: "0% 95%",
            end: "70% 50%",
            scrub: true,
            invalidateOnRefresh: true
        }
    });

    tl2.to("#Fanta", {
        top: () => getTargetPositions().fantaSec3Top + "px",
        left: () => getTargetPositions().fantaSec3Left + "px",
        width: "210px",
        height: "240px",
        scale: 1.48
    }, "card")
    .to("#slice", {
        top: () => getTargetPositions().sliceSec3Top + "px",
        left: () => getTargetPositions().sliceSec3Left + "px",
        width: "165px",
        height: "165px",
        scale: 0.78
    }, "card");
});

window.addEventListener("resize", () => ScrollTrigger.refresh());

// Interactive Cart, Modal & Mobile Menu
document.addEventListener("DOMContentLoaded", () => {
    let cart = [];

    const cartDrawer = document.getElementById("cartDrawer");
    const cartBackdrop = document.getElementById("cartBackdrop");
    const openCartBtn = document.getElementById("openCartBtn");
    const closeCartBtn = document.getElementById("closeCartBtn");
    const cartItemsContainer = document.getElementById("cartItemsContainer");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const checkoutFeedback = document.getElementById("checkoutFeedback");
    const toast = document.getElementById("toast");

    const showToast = (msg) => {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2000);
    };

    const toggleCart = (open) => {
        cartDrawer.classList.toggle("open", open);
        cartBackdrop.classList.toggle("active", open);
    };

    openCartBtn.addEventListener("click", () => toggleCart(true));
    closeCartBtn.addEventListener("click", () => toggleCart(false));
    cartBackdrop.addEventListener("click", () => toggleCart(false));

    const renderCart = () => {
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

        cartCount.textContent = totalQty;
        cartTotal.textContent = `₹${totalPrice}`;
        checkoutBtn.disabled = cart.length === 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your cart is empty. Pick a cold drink!</p>';
            return;
        }

        cartItemsContainer.innerHTML = cart.map((item, idx) => `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>₹${item.price * item.qty}</span>
                </div>
                <div class="qty-controls">
                    <button type="button" class="qty-btn" data-idx="${idx}" data-delta="-1">−</button>
                    <strong>${item.qty}</strong>
                    <button type="button" class="qty-btn" data-idx="${idx}" data-delta="1">+</button>
                </div>
            </div>
        `).join("");

        cartItemsContainer.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.idx, 10);
                const delta = parseInt(btn.dataset.delta, 10);
                cart[idx].qty += delta;
                if (cart[idx].qty <= 0) cart.splice(idx, 1);
                renderCart();
            });
        });
    };

    document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const { name, price, img } = btn.dataset;
            const existing = cart.find(item => item.name === name);
            if (existing) {
                existing.qty += 1;
            } else {
                cart.push({ name, price: parseInt(price, 10), img, qty: 1 });
            }
            checkoutFeedback.textContent = "";
            renderCart();
            showToast(`${name} added to cart!`);
        });
    });

    checkoutBtn.addEventListener("click", () => {
        cart = [];
        renderCart();
        checkoutFeedback.textContent = "Order placed! Your chilled drinks are on the way.";
    });

    // Nutrition Modal
    const nutritionModal = document.getElementById("nutritionModal");
    document.getElementById("openNutritionBtn").addEventListener("click", () => {
        nutritionModal.classList.add("active");
    });
    document.getElementById("closeNutritionBtn").addEventListener("click", () => {
        nutritionModal.classList.remove("active");
    });
    nutritionModal.addEventListener("click", (e) => {
        if (e.target === nutritionModal) nutritionModal.classList.remove("active");
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");
    menuToggle.addEventListener("click", () => navMenu.classList.toggle("active"));
    navMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => navMenu.classList.remove("active")));

    // Close overlays on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            toggleCart(false);
            nutritionModal.classList.remove("active");
        }
    });
});