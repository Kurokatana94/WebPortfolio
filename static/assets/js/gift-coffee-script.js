const stripe = Stripe(STRIPE_PK); // Your publishable key

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("donation-form");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const amountInput = document.getElementById("amount");
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount < 0.5) {
        alert("Minimum donation is £0.50");
        return;
    }

    const response = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(amount * 100) }) // Convert to pence
    });

    const data = await response.json();

    if (data.url) {
        window.location.href = data.url;
    } else {
        alert("Error: " + (data.error || "Unable to create session"));
    }
    });
});