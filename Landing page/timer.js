document.addEventListener("DOMContentLoaded", () => {
    // 1. Dynamic Rolling 3-Day Countdown Timer (Never shows expired negative numbers)
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    let countDownDate = localStorage.getItem("healthfit_promo_end");

    if (!countDownDate || new Date().getTime() > parseInt(countDownDate, 10)) {
        countDownDate = new Date().getTime() + threeDaysInMs;
        localStorage.setItem("healthfit_promo_end", countDownDate);
    }

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        if (distance <= 0) {
            document.getElementById("countdown").innerHTML = "<p>Offer Extended! Sign up today.</p>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").textContent = String(days).padStart(2, "0");
        document.getElementById("hours").textContent = String(hours).padStart(2, "0");
        document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
        document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
    };

    updateTimer();
    setInterval(updateTimer, 1000);

    // 2. Mobile Navigation Toggle
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");

    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => navLinks.classList.remove("active"));
    });

    // 3. Interactive Modal Logic
    const modal = document.getElementById("signupModal");
    const closeModalBtn = document.getElementById("closeModal");
    const openModalBtns = document.querySelectorAll(".open-modal-btn");
    const planSelect = document.getElementById("planSelect");
    const membershipForm = document.getElementById("membershipForm");
    const formSuccess = document.getElementById("formSuccess");

    openModalBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const selectedPlan = btn.getAttribute("data-plan");
            if (selectedPlan) {
                planSelect.value = selectedPlan;
            }
            formSuccess.classList.add("hidden");
            membershipForm.reset();
            if (selectedPlan) planSelect.value = selectedPlan;
            modal.classList.add("active");
        });
    });

    closeModalBtn.addEventListener("click", () => {
        modal.classList.remove("active");
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });

    membershipForm.addEventListener("submit", (e) => {
        e.preventDefault();
        formSuccess.classList.remove("hidden");
        setTimeout(() => {
            modal.classList.remove("active");
        }, 2500);
    });
});