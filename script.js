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

const catalogShell = document.querySelector("[data-catalog-shell]");
const miniProgramLink = "#小程序://深悦胜/21QtjahUivoi2De";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sortGoods = (goods) =>
  [...goods].sort((a, b) => {
    const categorySort = Number(a.categorySort ?? 999999) - Number(b.categorySort ?? 999999);
    if (categorySort !== 0) return categorySort;

    const sort = Number(a.sort ?? 999999) - Number(b.sort ?? 999999);
    if (sort !== 0) return sort;

    return Number(a.id ?? 0) - Number(b.id ?? 0);
  });

const groupGoodsForCatalog = (goods) => {
  const grouped = new Map();

  sortGoods(goods)
    .filter((item) => item && item.status === "on" && item.image)
    .forEach((item) => {
      const category = item.category || "未分类";
      if (!grouped.has(category)) {
        grouped.set(category, {
          category,
          categorySort: Number(item.categorySort ?? 999999),
          goodsList: []
        });
      }
      grouped.get(category).goodsList.push(item);
    });

  return [...grouped.values()].sort((a, b) => a.categorySort - b.categorySort);
};

const normalizeCatalogSections = (payload) => {
  const data = payload?.data;

  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]?.goodsList)) {
    return data
      .map((section) => ({
        category: section.category || "未分类",
        goodsList: Array.isArray(section.goodsList) ? section.goodsList : []
      }))
      .filter((section) => section.goodsList.length > 0);
  }

  if (Array.isArray(payload)) {
    return groupGoodsForCatalog(payload);
  }

  return [];
};

const renderCatalogPanel = (sections, activeCategory) => {
  const section = sections.find((item) => item.category === activeCategory) || sections[0];
  if (!section) return "";

  const items = section.goodsList
    .slice(0, 18)
    .map((goods) => {
      const desc = goods.desc || "小程序后台同步商品，规格、库存和价格以小程序或电话咨询为准。";
      const priceText = goods.price ? `小程序价 ¥${goods.price}` : "规格咨询";

      return `
        <article class="catalog-item">
          <img src="${escapeHtml(goods.image)}" alt="${escapeHtml(goods.name)}" loading="lazy" />
          <div class="catalog-item-body">
            <span>${escapeHtml(priceText)}</span>
            <h4>${escapeHtml(goods.name || "深悦胜商品")}</h4>
            <p>${escapeHtml(desc)}</p>
            <a href="${miniProgramLink}">进入小程序查看</a>
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <div class="catalog-heading">
      <h3>${escapeHtml(section.category)}</h3>
      <p>同步 ${section.goodsList.length} 个上架商品</p>
    </div>
    <div class="catalog-products">${items}</div>
  `;
};

const renderCatalog = (sections) => {
  if (!catalogShell || !Array.isArray(sections) || sections.length === 0) {
    return;
  }

  let activeCategory = sections[0].category;

  const paint = () => {
    const menu = sections
      .map(
        (section) => `
          <button class="${section.category === activeCategory ? "is-active" : ""}" type="button" data-catalog-category="${escapeHtml(section.category)}">
            <strong>${escapeHtml(section.category)}</strong>
            <span>${section.goodsList.length} 个商品</span>
          </button>
        `
      )
      .join("");

    catalogShell.innerHTML = `
      <div class="catalog-menu">${menu}</div>
      <div class="catalog-panel">${renderCatalogPanel(sections, activeCategory)}</div>
    `;

    catalogShell.querySelectorAll("[data-catalog-category]").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.getAttribute("data-catalog-category") || activeCategory;
        paint();
      });
    });

    catalogShell.querySelectorAll("img").forEach((image) => {
      image.addEventListener("error", () => {
        image.removeAttribute("src");
      });
    });
  };

  paint();
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
};

const loadCatalog = async () => {
  if (!catalogShell) {
    return;
  }

  try {
    const payload = await fetchJson("/api/goods/list.php");
    const sections = normalizeCatalogSections(payload);
    if (sections.length > 0) {
      renderCatalog(sections);
      return;
    }
  } catch (error) {
    // 本地静态预览没有 PHP 接口时，改读同一份商品 JSON 做展示。
  }

  try {
    const goods = await fetchJson("/data/goods.json");
    const sections = normalizeCatalogSections(goods);
    if (sections.length > 0) {
      renderCatalog(sections);
      return;
    }
  } catch (error) {
    catalogShell.innerHTML = '<div class="catalog-state">暂时无法读取商品数据，请稍后刷新。</div>';
  }
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
loadCatalog();
