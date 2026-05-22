const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

navToggle.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("is-open");
  header.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
});

mobileNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("is-open");
    header.classList.remove("is-open");
    navToggle.setAttribute("aria-label", "打开导航");
  });
});

document.querySelectorAll(".product-card img").forEach((image) => {
  image.addEventListener("error", () => {
    image.closest(".product-card")?.classList.add("image-fallback");
    image.removeAttribute("src");
  });
});

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
