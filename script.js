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
      const desc = goods.desc || "规格、配送方式和适合人数可进入微信小程序查看，或电话咨询确认。";
      const priceText = goods.price ? `参考 ¥${goods.price}` : "咨询规格";
      const tags = Array.isArray(goods.tags) ? goods.tags.filter(Boolean).slice(0, 2) : [];
      const tagHtml = [
        ...tags,
        goods.type === "custom" ? "多规格可选" : "当季供应"
      ]
        .map((tag) => `<b>${escapeHtml(tag)}</b>`)
        .join("");

      return `
        <article class="catalog-item">
          <img src="${escapeHtml(goods.image)}" alt="${escapeHtml(goods.name)}" loading="lazy" />
          <div class="catalog-item-body">
            <span>${escapeHtml(priceText)}</span>
            <h4>${escapeHtml(goods.name || "深悦胜商品")}</h4>
            <p>${escapeHtml(desc)}</p>
            <div class="catalog-labels">${tagHtml}</div>
            <a href="${miniProgramLink}">查看规格与购买</a>
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <div class="catalog-heading">
      <h3>${escapeHtml(section.category)}</h3>
      <p>${escapeHtml(getCategoryIntro(section.category))} 已为你整理 ${section.goodsList.length} 款选择，具体规格与配送可继续咨询确认。</p>
    </div>
    <div class="catalog-products">${items}</div>
  `;
};

const getCategoryIntro = (category) => {
  const introMap = {
    双人轻享: "适合少量尝鲜、双人晚餐和日常刺身加餐。",
    家庭轻宴: "适合家庭聚餐、朋友小聚和周末餐桌。",
    宴请拼盘: "适合多人宴请、节日聚会和礼赠场景。",
    单品加点: "适合作为刺身拼盘、日料餐桌和轻食套餐的补充。"
  };

    return introMap[category] || "甄选适合不同用餐场景的海鲜食材。";
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
            <span>${section.goodsList.length} 款可选</span>
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
    // Local preview falls back to bundled product data when the live product API is unavailable.
  }

  try {
    const goods = await fetchJson("/data/goods.json");
    const sections = normalizeCatalogSections(goods);
    if (sections.length > 0) {
      renderCatalog(sections);
      return;
    }
  } catch (error) {
    catalogShell.innerHTML = '<div class="catalog-state">产品暂时没有加载出来，请稍后刷新或直接联系我们。</div>';
  }
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
loadCatalog();
