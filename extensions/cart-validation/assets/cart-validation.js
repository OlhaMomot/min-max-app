document.addEventListener("cartValidationErrors", (event) => {
  const errors = event.detail;
  const checkoutButton = document.querySelector("button[name='checkout']");

  if (checkoutButton) {
    checkoutButton.disabled = true;
  }

  // Remove existing error popups
  document.querySelectorAll(".cart-error-popup").forEach(el => el.remove());

  // Create error popup
  const errorPopup = document.createElement("div");
  errorPopup.classList.add("cart-error-popup-container");

  console.log('ERRORS FROM VALIDATION:', errors);
  errorPopup.innerHTML = `
    <div class="cart-error-popup">
      <div class="cart-error-popup-content">
          <h3>Cart Validation Error</h3>
          <ul>
              ${errors.map(error => `<li>${error}</li>`).join("")}
          </ul>
          <button class="close-cart-error">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(errorPopup);

  // Close button
  document.querySelector(".close-cart-error").addEventListener("click", () => {
    document.querySelector(".cart-error-popup-container").remove();
  });
});
