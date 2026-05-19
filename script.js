const APP_VERSION =
  "1.1.0";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyOdutxwwRKU4rHKg58l2GLZ0yBRadCQ7EWCImcafIFU731efq3flrs5JZs8Km2WN4y/exec";

let currentRequestPage = 1;
let currentSongPage = {};

let allSongData = [];
let songLoaded = false;
let allRequestData = [];
let requestLoaded = false;
let selectAnimating = false;

let currentRole = "";

let requestSortMode = "newest";
let currentRequestKeyword = "";

let currentSongKeyword = "";
let currentSongCategory = "all";

let notificationImages = [];

let currentNotifIndex = 0;

let notifInterval = null;

let notifResumeTimeout = null;

let isDragging = false;

let notifStartX = 0;

let notifMoveX = 0;
let notifDragged = false;
let notifModalTouched = false;
let notifOpened = false;
let isLoadingSongs = false;
let isLoadingRequests = false;
let isLoadingNotif = false;

const SESSION_TIMEOUT =
  60 * 60 * 1000;

let sessionTimer = null;

const notifTrack =
  document.getElementById(
    "notifTrack"
  );

const notifDots =
  document.getElementById(
    "notifDots"
  );

const loginPage =
  document.getElementById("loginPage");

const appVersion =
  document.getElementById(
    "appVersion"
  );

if (appVersion) {
  appVersion.innerText =
    `Version ${APP_VERSION}`;
}

const appPage =
  document.getElementById("appPage");

const loginForm =
  document.getElementById("loginForm");

const roleBadge =
  document.getElementById("roleBadge");

const songTables =
  document.getElementById("songTables");

let requestHead =
  document.getElementById("requestHead");

let requestBody =
  document.getElementById("requestBody");

const logoutBtn =
  document.getElementById("logoutBtn");

const requestBtn =
  document.getElementById("requestBtn");

const songSearch =
  document.getElementById("songSearch");

const requestSearch =
  document.getElementById(
    "requestSearch"
  );

const songCategoryFilter =
  document.getElementById(
    "songCategoryFilter"
  );

const songCategoryText =
  document.getElementById(
    "songCategoryText"
  );

const requestFilter =
  document.getElementById(
    "requestFilter"
  );

const filterSelectedText =
  document.getElementById(
    "filterSelectedText"
  );

const filterOptions =
  requestFilter.querySelectorAll(
    ".filter-option"
  );

requestFilter.addEventListener(
  "click",
  (e) => {
    e.stopPropagation();
    requestFilter.classList.toggle(
      "active"
    );
  }
);

if (songCategoryFilter) {
  const categoryOptions =
    songCategoryFilter.querySelectorAll(
      ".filter-option"
    );

  songCategoryFilter.addEventListener(
    "click",
    (e) => {
      e.stopPropagation();
      songCategoryFilter.classList.toggle(
        "active"
      );
    }
  );

  categoryOptions.forEach(option => {

    option.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        categoryOptions.forEach(o =>
          o.classList.remove("active")
        );
        option.classList.add(
          "active"
        );

        currentSongCategory =
          option.dataset.value;

        songCategoryText.innerText =
          option.innerText;

        songCategoryFilter.classList.remove(
          "active"
        );

        applySongFilter();
        scrollToTop();
      }
    );
  });
}

filterOptions.forEach(option => {

  option.addEventListener(
    "click",
    (e) => {
      e.stopPropagation();
      filterOptions.forEach(o =>
        o.classList.remove("active")
      );

      option.classList.add(
        "active"
      );

      const value =
        option.dataset.value;

      requestSortMode = value;

      filterSelectedText.innerText =
        option.innerText;

      currentRequestPage = 1;

      requestFilter.classList.remove(
        "active"
      );

      renderRequestTable(allRequestData);
      scrollToTop();
    }
  );
});

document.addEventListener(
  "click",
  () => {

    requestFilter.classList.remove(
      "active"
    );

    if (songCategoryFilter) {
      songCategoryFilter.classList.remove(
        "active"
      );
    }
    if (customSelect) {
      customSelect.classList.remove(
        "active"
      );
    }
  }
);

function getSongItemsPerPage() {

  const h =
    window.innerHeight;

  if (h <= 750) {
    return 6;
  }

  if (h <= 850) {
    return 8;
  }

  if (h <= 950) {
    return 10;
  }

  return 12;
}


function getRequestItemsPerPage() {

  const h =
    window.innerHeight;

  if (h <= 700) {
    return 5;
  }

  if (h <= 800) {
    return 7;
  }

  if (h <= 900) {
    return 8;
  }

  return 10;
}

function updateNotifSlider() {

  notifTrack.style.transform =
    `translateX(-${currentNotifIndex * 100}%)`;

  document
    .querySelectorAll(".notif-dot")
    .forEach((dot, index) => {

      dot.classList.toggle(
        "active",
        index ===
        (
          currentNotifIndex %
          notificationImages.length
        )
      );
    });
}

function setLoginLoading(isLoading) {

  const roleInput =
    document.getElementById("role");

  const passwordInput =
    document.getElementById("password");

  const submitBtn =
      document.getElementById(
    "loginBtn"
  );

  if (isLoading) {

    loginForm.classList.add(
      "form-loading"
    );

    submitBtn.disabled = true;

    passwordInput.disabled = true;

    customSelect.style.pointerEvents =
      "none";

    customSelect.style.opacity =
      ".6";

    submitBtn.innerHTML = `
      <i class="ri-loader-4-line rotating"></i>
      Memeriksa...
    `;

  } else {

    loginForm.classList.remove(
      "form-loading"
    );

    submitBtn.disabled = false;

    passwordInput.disabled = false;

    customSelect.style.pointerEvents =
      "";

    customSelect.style.opacity =
      "";

    submitBtn.innerHTML =
      "Masuk";
  }
}

function startNotifAutoplay() {

  clearInterval(notifInterval);

  if (
    notificationImages.length <= 1
  ) return;

  notifInterval =
    setInterval(() => {

      currentNotifIndex++;

      if (
        currentNotifIndex >=
        notificationImages.length
      ) {

        currentNotifIndex = 0;
      }

      notifTrack.style.transition =
        "transform .45s ease";

      updateNotifSlider();

    }, 5000);
}

function pauseNotifAutoplay() {

  clearInterval(notifInterval);

  clearTimeout(
    notifResumeTimeout
  );

  notifResumeTimeout =
    setTimeout(() => {

      startNotifAutoplay();

    }, 10000);
}

if (requestSearch) {

  requestSearch.addEventListener(
    "input",
    () => {

      currentRequestKeyword =
        requestSearch.value
          .toLowerCase()
          .trim();

      currentRequestPage = 1;

      renderRequestTable(allRequestData);

      scrollToTop();
    }
  );
}

const requestSearchIcon =
  document.querySelector(
    ".request-search i"
  );

if (requestSearchIcon) {

  requestSearchIcon.addEventListener(
    "click",
    () => {

      requestSearch.value = "";

      currentRequestKeyword = "";

      currentRequestPage = 1;

      renderRequestTable(
        allRequestData
      );

      requestSearch.focus();
    }
  );
}

let isSendingRequest = false;

loginForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const role =
      document.getElementById("role").value;

    const password =
      document.getElementById("password").value;

    const userName =
      document
        .getElementById("nameInput")
        .value
        .trim();

    if (!userName) {
      alert("Nama tidak boleh kosong");
      return;
    }

    if (
      userName.length < 3
    ) {

      alert(
        "Nama minimal 3 huruf"
      );

      return;
    }

    if (!role || !password) {

      alert("Lengkapi data login");

      return;
    }

    const submitBtn =
          document.getElementById(
      "loginBtn"
    );

    setLoginLoading(true);

    try {

      const response =
        await fetch(
          SCRIPT_URL,
          {
            method: "POST",

            body: JSON.stringify({
              action: "login",
              role,
              password
            })
          }
        );

      const result =
        await response.json();

      if (!result.success) {

        alert("Password salah");

        setLoginLoading(false);

        return;
      }

      localStorage.setItem(
        "aqila_role",
        role
      );

      fetch(
        SCRIPT_URL,

        {

          method:
            "POST",

          body:
            JSON.stringify({

              action:
                "saveLogin",

              name:
                userName,

              role:
                {
                  player: "Player",
                  vocal: "Vocal",
                  lainnya: "Guest"
                }[role]

            })

        }
      );

      localStorage.removeItem(
        "aqila_logged_out"
      );

      const rememberMe =
      document.getElementById(
        "rememberMe"
      ).checked;

      if (rememberMe) {

        localStorage.setItem(
          "aqila_remember",
          "true"
        );

      } else {

        localStorage.removeItem(
          "aqila_remember"
        );
      }

      localStorage.setItem(
        "aqila_name",
        userName
      );

      alert(
        "Login berhasil 🔥"
      );

      setTimeout(() => {

        showApp(role);

      }, 300);

    } catch (error) {

      console.error(error);

      alert("Gagal login");

      setLoginLoading(false);
    }
  }
);

async function loadNotification() {

  if (isLoadingNotif) return;

  isLoadingNotif = true;

  let timeout;

  try {

    const controller =
      new AbortController();

    timeout =
      setTimeout(() => {

        controller.abort();

      }, 10000);

    const response =
      await fetch(
        SCRIPT_URL,
        {
          method: "POST",

          signal:
            controller.signal,

          body: JSON.stringify({
            action: "notification"
          })
        }
      );

    const data =
      await response.json();

    notificationImages =
      data.images || [];

    const notifBadge =
      document.getElementById(
        "notifBadge"
      );

    if (notifBadge) {

      const total =
        notificationImages.length;

      notifBadge.innerText =
        total;

      const oldCount =
        Number(
          notifBadge.dataset.count || 0
        );

      notifBadge.dataset.count =
        total;

      if (total > 0) {

        notifBadge.style.display =
          notifOpened
            ? "none"
            : "flex";

        notifBadge.innerText =
          total;

        notifBadge.style.animation =
          "none";

        notifBadge.offsetHeight;

        if (oldCount === 0) {

          notifBadge.style.animation =
            "notifAppear .45s ease";

        } else if (oldCount !== total) {

          notifBadge.style.animation =
            "notifUpdate .35s ease";
        }

      } else {

        notifBadge.style.display =
          "none";
      }
    }

    notificationImages.forEach(item => {

      const preload =
        new Image();

      preload.src =
        item.image;
    });

  } catch (error) {

    console.error(
      "Notif gagal dimuat",
      error
    );

  } finally {

    clearTimeout(timeout);
    isLoadingNotif = false;
  }
}

function showApp(role) {

  currentRole = role;

  const accountRoleText =
    document.getElementById(
      "accountRoleText"
    );

  if (accountRoleText) {

    const userName =
      localStorage.getItem(
        "aqila_name"
      ) || "Pengguna";

    accountRoleText.innerText =
      userName;
  }

  document.body.classList.remove(
    "player-mode",
    "vocal-mode",
    "lainnya-mode"
  );

  document.body.classList.add(
    role + "-mode"
  );

  loginPage.classList.add("hidden");

  appPage.classList.remove("hidden");

const badgeMap = {

  player:
    "PLAYER",

  vocal:
    "VOCAL",

  lainnya:
    "GUEST"
};

if (badgeMap[role]) {

  roleBadge.innerText =
    badgeMap[role];

  roleBadge.style.display =
    "inline-flex";

} else {

  roleBadge.style.display =
    "none";
}

  loadSongData(role);

  loadRequestData();
  loadNotification();
  initSessionListener();
}

async function loadSongData(role) {
  if (isLoadingSongs) return;

  isLoadingSongs = true;

  if (!songLoaded) {

    songTables.innerHTML = `
      <div class="loading-state">

        <i class="ri-loader-4-line rotating"></i>

        Memuat daftar lagu...

      </div>
    `;
  }
  
let timeout;

try {

    const controller =
      new AbortController();

    timeout =
      setTimeout(() => {

        controller.abort();

      }, 10000);

    const response =
      await fetch(
        SCRIPT_URL,
        {
          method: "POST",

          signal:
            controller.signal,

          body: JSON.stringify({
            action: "songs"
          })
        }
      );

    const data =
      await response.json();

    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      songLoaded = true;

      songTables.innerHTML = `
        <div class="empty-state">

          Belum ada lagu

        </div>
      `;

      return;
    }

    data.sort((a, b) => {
      const laguA =
        (a["Nama Lagu"] || "").toLowerCase();

      const laguB =
        (b["Nama Lagu"] || "").toLowerCase();

      return laguA.localeCompare(laguB, "id");
    });

    const newData =
      JSON.stringify(data);

    const oldData =
      JSON.stringify(allSongData);

    if (newData !== oldData) {
      allSongData = data;
      applySongFilter();
    }

songLoaded = true;

  } catch (error) {

    console.error(error);

    setTimeout(() => {

      loadSongData(role);

    }, 3000);

    return;
    
  }  finally {
    isLoadingSongs = false;
    clearTimeout(timeout);
  }
}

function renderTable(data, role) {

  const scrollPositions = {};

  document
    .querySelectorAll("#songTables .table-responsive")
    .forEach((el, index) => {
      scrollPositions[index] = el.scrollLeft;
    });

  const categories = [
    "Trend 2026",
    "Trend 2025",
    "Trend 2024",
    "Trend 2023 Kebawah",
    "Lawasan V1",
    "Lawasan V2",
    "Campursari",
    "Religi"
  ];

  songTables.innerHTML = "";

  let keys = [];

  if (role === "player") {

    keys = [
      "Nama Lagu",
      "Nada Pria",
      "Nada Duet",
      "Nada Wanita",
      "Tempo",
      "Catatan"
    ];

  } else {

    keys = [
      "Nama Lagu",
      "Catatan"
    ];
  }

  const sortedCategories =

    currentSongKeyword

      ? [...categories].sort((a, b) => {

          const totalA =
            data.filter(item =>
              item["Kategori"] === a
            ).length;

          const totalB =
            data.filter(item =>
              item["Kategori"] === b
            ).length;

          return totalB - totalA;
        })

      : categories;

  const visibleCategories =

    currentSongCategory === "all"

      ? sortedCategories

      : [currentSongCategory];

  visibleCategories.forEach(category => {

    let filteredData =
      data.filter(item =>
        item["Kategori"] === category
      );

    const card =
      document.createElement("div");

    card.className =
      "table-card";

    const title =
      document.createElement("div");

    title.className =
      "card-title";

    title.innerHTML = `
      <div class="category-label">
        <span class="category-dot"></span>
        ${category}
      </div>
    `;

    card.appendChild(title);

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "table-responsive";

    if (filteredData.length === 0) {

      wrapper.innerHTML = `
        <div class="empty-state">
          Belum ada lagu
        </div>
      `;

      card.appendChild(wrapper);

      songTables.appendChild(card);

      return;
    }

    const totalPages =
      Math.ceil(
        filteredData.length /
        getSongItemsPerPage()
      );

    const page =
      Math.min(
        currentSongPage[category] || 1,
        totalPages || 1
      );

    currentSongPage[category] =
      page;

    const start =
      (page - 1)
      * getSongItemsPerPage();

    const end =
      start + getSongItemsPerPage();

    const paginatedData =
      filteredData.slice(
        start,
        end
      );

    const table =
      document.createElement("table");

    const thead =
      document.createElement("thead");

    const headRow =
      document.createElement("tr");

    keys.forEach(key => {

      const th =
        document.createElement("th");

      th.textContent = key;

      headRow.appendChild(th);
    });

    thead.appendChild(headRow);

    table.appendChild(thead);

    const tbody =
      document.createElement("tbody");

    paginatedData.forEach(item => {

      const tr =
        document.createElement("tr");

      keys.forEach(key => {

        const td =
          document.createElement("td");

        const raw =
  item[key];

const value =
  raw !== undefined &&
  raw !== null &&
  String(raw).trim() !== ""
    ? raw
    : "-";

        if (key === "Catatan") {

          td.classList.add(
            "song-note-col"
          );
        }

        if (key === "Waktu") {

          const parts =
            value.split(" ");

          td.innerHTML =
            `${parts[0]}<br>${parts[1] || ""}`;

        } else {

          td.textContent = value;
        }

        if (key === "Nama Lagu") {

          td.classList.add(
            "text-left"
          );
        }

        if (key === "Catatan") {

          td.classList.add(
            "note-cell"
          );

          if (value === "-") {

            td.classList.add(
              "note-empty"
            );
          }
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    wrapper.appendChild(table);

    card.appendChild(wrapper);

    const pagination =
      document.createElement(
        "div"
      );

    pagination.className =
      "pagination";

    card.appendChild(
      pagination
    );

    renderSongPagination(
      pagination,
      filteredData.length,
      category
    );

    songTables.appendChild(
      card
    );
  });

    setTimeout(() => {
    document
      .querySelectorAll("#songTables .table-responsive")
      .forEach((el, index) => {
        if (scrollPositions[index] !== undefined) {
          el.scrollLeft = scrollPositions[index];
        }
      });
  }, 0);
}

if (songSearch) {

  songSearch.addEventListener(
    "input",
    () => {

      currentSongKeyword =
        songSearch.value
          .toLowerCase()
          .trim();
      
      currentSongPage = {};

      applySongFilter();

      scrollToTop();
    }
  );
}

const songSearchIcon =
  document.querySelector(
    ".search-box i"
  );

if (songSearchIcon) {

  songSearchIcon.addEventListener(
    "click",
    () => {

      songSearch.value = "";

      currentSongKeyword = "";

      applySongFilter();

      songSearch.focus();
    }
  );
}

function applySongFilter() {

  let filtered =
    [...allSongData];

  if (currentSongKeyword) {

    filtered =
      filtered.filter(item => {

        const lagu =
          item["Nama Lagu"] || "";

        return lagu
          .toLowerCase()
          .includes(currentSongKeyword);
      });
  }

  renderTable(
    filtered,
    currentRole
  );
}

async function loadRequestData() {
    if (isLoadingRequests) return;

  isLoadingRequests = true;

if (!requestLoaded) {

  const requestTable =
  document.querySelector(
    "#requestSection .table-responsive"
  );

  requestTable.innerHTML = `
    <div class="loading-state">

      <i class="ri-loader-4-line rotating"></i>

      Memuat daftar request...

    </div>
  `;
}

  let timeout;

  try {

    const controller =
      new AbortController();

    timeout =
      setTimeout(() => {

        controller.abort();

      }, 10000);

    const response =
      await fetch(
        SCRIPT_URL,
        {
          method: "POST",

          signal:
            controller.signal,

          body: JSON.stringify({
            action: "requests"
          })
        }
      );
    
    const data =
      await response.json();

  if (Array.isArray(data)) {

    const newData =
      JSON.stringify(data);

    const oldData =
      JSON.stringify(allRequestData);

    if (newData !== oldData) {
      allRequestData = data;

      renderRequestTable(
        allRequestData
      );
    }

    requestLoaded = true;
  }

  } catch (error) {

    console.error(error);

    const requestTable =
      document.querySelector(
        "#requestSection .table-responsive"
      );

    setTimeout(() => {

      loadRequestData();

    }, 3000);
  } finally {
    isLoadingRequests = false;
    clearTimeout(timeout);
  }
}

function renderRequestTable(data) {

  const keys =
    currentRole === "lainnya"
      ? [
          "Waktu",
          "Nama Lagu",
          "Catatan"
        ]
      : [
          "Waktu",
          "Nama Lagu",
          "Catatan",
          "Peminta"
        ];

  const requestTable =
    document.querySelector(
      "#requestSection .table-responsive"
    );
  
  const savedScrollLeft =
  requestTable.scrollLeft;

requestTable.innerHTML = `
  <table>

    <thead>
      <tr id="requestHead"></tr>
    </thead>

    <tbody id="requestBody"></tbody>

  </table>
`;

requestHead =
  document.getElementById(
    "requestHead"
  );

requestBody =
  document.getElementById(
    "requestBody"
  );

  if (!data || data.length === 0) {

    requestTable.classList.add(
      "table-empty"
    );

    requestTable.innerHTML = `
      <div class="empty-state">

        Belum ada request

      </div>
    `;

    document
      .getElementById(
        "requestPagination"
      )
      .classList.add("hidden");

    return;
  }

  requestTable.classList.remove(
    "table-empty"
  );

  requestHead.innerHTML = "";

  keys.forEach(key => {

    const th =
      document.createElement("th");

    th.textContent = key;

    requestHead.appendChild(th);
  });

  requestBody.innerHTML = "";

  if (currentRequestKeyword) {

    data = data.filter(item => {

      const lagu =
        item["Nama Lagu"] || "";

      const catatan =
        item["Catatan"] || "";

      const peminta =
        item["Peminta"] || "";

      return (
        lagu
          .toLowerCase()
          .includes(currentRequestKeyword)

        ||

        catatan
          .toLowerCase()
          .includes(currentRequestKeyword)

        ||

        peminta
          .toLowerCase()
          .includes(currentRequestKeyword)
      );
    });
  }

  data = [...data];

  data.sort((a, b) => {

    const timeA =
      new Date(a["Waktu"]).getTime();

    const timeB =
      new Date(b["Waktu"]).getTime();

    if (requestSortMode === "newest") {
      return timeB - timeA;
    }

    return timeA - timeB;
  });

  const totalRequestPages =
    Math.ceil(
      data.length /
      getRequestItemsPerPage()
    );

  currentRequestPage =
    Math.min(
      currentRequestPage,
      totalRequestPages || 1
    );

  const start =
    (currentRequestPage - 1)
    * getRequestItemsPerPage();

  const end =
    start + getRequestItemsPerPage();

  const paginatedData =
    data.slice(start, end);

  paginatedData.forEach(item => {

    const tr =
      document.createElement("tr");

    keys.forEach(key => {

      const td =
        document.createElement("td");

      let value =
        item[key] || "-";

      if (key === "Waktu") {

        const date =
          new Date(value);

        if (!isNaN(date)) {

          value =
            date.toLocaleString(
              "id-ID",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              }
            );
        }
      }

      td.textContent = value;

      if (key === "Nama Lagu") {

        td.classList.add(
          "text-left"
        );
      }

      if (key === "Catatan") {

        td.classList.add(
          "note-cell"
        );

        if (value === "-") {

          td.classList.add(
            "note-empty"
          );
        }
      }

      if (key === "Waktu") {

        td.classList.add(
          "date-cell"
        );
      }

      tr.appendChild(td);
    });

    requestBody.appendChild(tr);
  });

  renderRequestPagination(
    data.length
  );

  setTimeout(() => {
    requestTable.scrollLeft =
      savedScrollLeft;
  }, 0);
}

function renderSongPagination(
  pagination,
  totalItems,
  category
) {

  pagination.innerHTML =
    "";

  const totalPages =
    Math.ceil(
      totalItems /
        getSongItemsPerPage()
    );

  if (
    totalPages <= 1
  ) {

    pagination.classList.add(
      "hidden"
    );

    return;
  }

  pagination.classList.remove(
    "hidden"
  );

  const currentPage =
    currentSongPage[
      category
    ] || 1;

  function goToSongPage(
    page
  ) {

    const oldScrollY =
      window.scrollY;

    currentSongPage[
      category
    ] = page;

    applySongFilter();

    window.scrollTo(
      0,
      oldScrollY
    );

  requestAnimationFrame(() => {

    const card =
      [...document.querySelectorAll(
        "#songTables .table-card"
      )]
      .find(card =>
        card.textContent.includes(
          category
        )
      );

    if (!card) return;

    const y =
      card.getBoundingClientRect()
        .top +
      window.scrollY -
      90;

    window.scrollTo({
      top: y,
      behavior: "smooth"
    });

  });
}
  const prev =
    document.createElement(
      "button"
    );

  prev.innerHTML =
    '<i class="ri-arrow-left-s-line"></i>';

  prev.disabled =
    currentPage === 1;

  prev.onclick =
    () =>
      goToSongPage(
        currentPage - 1
      );

  pagination.appendChild(
    prev
  );

  addPageButton(1);

  if (
    currentPage > 2
  ) {

    addDots();
  }

  if (

    currentPage !== 1 &&

    currentPage !== totalPages

  ) {

    addPageButton(
      currentPage
    );
  }

  if (

    currentPage <

    totalPages - 1

  ) {

    addDots();
  }

  if (
    totalPages > 1
  ) {

    addPageButton(
      totalPages
    );
  }

  const next =
    document.createElement(
      "button"
    );

  next.innerHTML =
    '<i class="ri-arrow-right-s-line"></i>';

  next.disabled =
    currentPage ===
    totalPages;

  next.onclick =
    () =>
      goToSongPage(
        currentPage + 1
      );

  pagination.appendChild(
    next
  );

  function addPageButton(
    page
  ) {

    const btn =
      document.createElement(
        "button"
      );

    btn.innerText =
      page;

    if (
      page ===
      currentPage
    ) {

      btn.classList.add(
        "active"
      );
    }

    btn.onclick =
      () =>
        goToSongPage(
          page
        );

    pagination.appendChild(
      btn
    );
  }

  function addDots() {

    const dots =
      document.createElement(
        "span"
      );

    dots.className =
      "pagination-dots";

    dots.innerText =
      "...";

    pagination.appendChild(
      dots
    );
  }
}

function renderRequestPagination(totalItems) {

  const pagination =
    document.getElementById(
      "requestPagination"
    );

  pagination.innerHTML = "";

  const totalPages =
    Math.ceil(
      totalItems /
      getRequestItemsPerPage()
    );

  if (
    totalItems <=
    getRequestItemsPerPage()
  ) {

    pagination.classList.add(
      "hidden"
    );

    return;
  }

  pagination.classList.remove(
    "hidden"
  );

  const prevBtn =
    document.createElement("button");

  prevBtn.innerHTML =
    '<i class="ri-arrow-left-s-line"></i>';

  prevBtn.disabled =
    currentRequestPage === 1;

  prevBtn.onclick = () => {

    currentRequestPage--;

    renderRequestTable(allRequestData);

    scrollToTop(
  document.getElementById(
    "requestSection"
  )
);
  };

  pagination.appendChild(prevBtn);

addPageButton(1);

if (currentRequestPage > 2) {

  addDots();
}

if (
  currentRequestPage !== 1 &&
  currentRequestPage !== totalPages
) {

  addPageButton(
    currentRequestPage
  );
}

if (
  currentRequestPage <
  totalPages - 1
) {

  addDots();
}

if (totalPages > 1) {

  addPageButton(
    totalPages
  );
}

  const nextBtn =
    document.createElement("button");

  nextBtn.innerHTML =
    '<i class="ri-arrow-right-s-line"></i>';

  nextBtn.disabled =
    currentRequestPage === totalPages;

  nextBtn.onclick = () => {

    currentRequestPage++;

    renderRequestTable(allRequestData);

    scrollToTop(
      document.getElementById(
        "requestSection"
      )
    );
  };

  pagination.appendChild(nextBtn);

  function addPageButton(page) {

    const btn =
      document.createElement("button");

    btn.innerText = page;

    if (page === currentRequestPage) {

      btn.classList.add(
        "active"
      );
    }

    btn.onclick = () => {

      currentRequestPage = page;

      renderRequestTable(allRequestData);

      scrollToTop(
  document.getElementById(
    "requestSection"
  )
);
    };

    pagination.appendChild(btn);
  }

  function addDots() {

    const dots =
      document.createElement("span");

    dots.className =
      "pagination-dots";

    dots.innerText = "...";

    pagination.appendChild(dots);
  }
}

function scrollToTop(
  target = null
) {

  if (target) {

const y =
  target.getBoundingClientRect()
    .top +
  window.pageYOffset +
  35;

    window.scrollTo({
      top: y,
      behavior: "smooth"
    });

    return;
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

const navBtns =
  document.querySelectorAll(".nav-btn");

const sections =
  document.querySelectorAll(".content-section");

navBtns.forEach(btn => {

  btn.addEventListener(
    "click",
    () => {

      navBtns.forEach(b =>
        b.classList.remove("active")
      );

      btn.classList.add("active");

      const target =
        btn.dataset.target;

      localStorage.setItem(
        "aqila_tab",
        target
      );

      sections.forEach(section => {

        section.classList.remove(
          "active"
        );
      });

      document
        .getElementById(target)
        .classList.add("active");

      document
        .querySelectorAll(
          ".table-responsive"
        )
        .forEach(el => {

          el.scrollLeft = 0;

        });

      scrollToTop();
    }
  );
});

const accountRoleText =
  document.getElementById(
    "accountRoleText"
  );

const googleSearchForm =
  document.getElementById(
    "googleSearchForm"
  );

const googleSearchInput =
  document.getElementById(
    "googleSearchInput"
  );

const googleIcon =

  document.querySelector(

    ".google-search-box i"

  );

if (googleIcon) {

  googleIcon.addEventListener(

    "click",

    () => {

      googleSearchInput.value = "";

      resetGooglePlaceholder();

      googleSearchInput.focus();

    }

  );

}

const openSpreadsheetBtn =
  document.getElementById(
    "openSpreadsheetBtn"
  );

const googlePlaceholders = [
  "Lirik Lagu Kerinduan",
  "Chordtela Lagu Gelandangan"
];

const youtubeSearchForm =
  document.getElementById(
    "youtubeSearchForm"
  );

const youtubeSearchInput =
  document.getElementById(
    "youtubeSearchInput"
  );

const youtubeIcon =

  document.querySelector(

    ".youtube-search-box i"

  );

if (youtubeIcon) {

  youtubeIcon.addEventListener(

    "click",

    () => {

      youtubeSearchInput.value = "";

      resetYoutubePlaceholder();

      youtubeSearchInput.focus();

    }

  );

}

if (youtubeSearchForm) {

  youtubeSearchForm.addEventListener(
    "submit",
    (e) => {

      e.preventDefault();

      const keyword =
        youtubeSearchInput.value.trim();

      if (!keyword) {

        alert("Masukkan kata pencarian");

        return;
      }

      const url =

        window.innerWidth <= 768

          ? `https://poketube.fun/app?mobilesearch=${encodeURIComponent(keyword)}`

          : `https://poketube.fun/search?query=${encodeURIComponent(keyword)}`;

      window.open(
        url,
        "_blank"
      );
    }
  );

  const youtubePlaceholders = [
    "Karaoke Hadirmu Bagai Mimpi",
    "Karaoke Pertemuan Nada Wanita"
  ];

  let youtubePlaceholderIndex = 0;
  let youtubeTypingTimer = null;

  function resetYoutubePlaceholder() {
    clearTimeout(youtubeTypingTimer);

    if (!youtubeSearchInput) return;

    youtubeSearchInput.placeholder =
      "Cari di YouTube...";

    youtubeTypingTimer =
      setTimeout(showYoutubeSuggestion, 5000);
  }

  function showYoutubeSuggestion() {
    if (!youtubeSearchInput) return;

    if (
      document.activeElement === youtubeSearchInput ||
      youtubeSearchInput.value.trim() !== ""
    ) {
      resetYoutubePlaceholder();
      return;
    }

    const text =
      youtubePlaceholders[youtubePlaceholderIndex];

    youtubeSearchInput.placeholder = "";

    let charIndex = 0;

    function typeText() {
      if (
        document.activeElement === youtubeSearchInput ||
        youtubeSearchInput.value.trim() !== ""
      ) {
        resetYoutubePlaceholder();
        return;
      }

      charIndex++;

      youtubeSearchInput.placeholder =
        text.substring(0, charIndex);

      if (charIndex < text.length) {
        youtubeTypingTimer =
          setTimeout(typeText, 80);
        return;
      }

      youtubeTypingTimer =
        setTimeout(() => {
          youtubeSearchInput.placeholder =
            "Cari di YouTube...";

          youtubePlaceholderIndex =
            (youtubePlaceholderIndex + 1) %
            youtubePlaceholders.length;

          youtubeTypingTimer =
            setTimeout(showYoutubeSuggestion, 5000);
        }, 3000);
    }

    typeText();
  }

  if (youtubeSearchInput) {
    youtubeSearchInput.addEventListener(
      "focus",
      resetYoutubePlaceholder
    );

    youtubeSearchInput.addEventListener(
      "input",
      resetYoutubePlaceholder
    );
  }

  resetYoutubePlaceholder();
}

let googlePlaceholderIndex = 0;
let googleTypingTimer = null;

function resetGooglePlaceholder() {
  clearTimeout(googleTypingTimer);

  if (!googleSearchInput) return;

  googleSearchInput.placeholder =
    "Cari di Google...";

  googleTypingTimer =
    setTimeout(showGoogleSuggestion, 5000);
}

function showGoogleSuggestion() {
  if (!googleSearchInput) return;

  if (
    document.activeElement === googleSearchInput ||
    googleSearchInput.value.trim() !== ""
  ) {
    resetGooglePlaceholder();
    return;
  }

  const text =
    googlePlaceholders[googlePlaceholderIndex];

  googleSearchInput.placeholder = "";

  let charIndex = 0;

  function typeText() {
    if (
      document.activeElement === googleSearchInput ||
      googleSearchInput.value.trim() !== ""
    ) {
      resetGooglePlaceholder();
      return;
    }

    charIndex++;

    googleSearchInput.placeholder =
      text.substring(0, charIndex);

    if (charIndex < text.length) {
      googleTypingTimer =
        setTimeout(typeText, 80);
      return;
    }

    googleTypingTimer =
      setTimeout(() => {
        googleSearchInput.placeholder =
          "Cari di Google...";

        googlePlaceholderIndex =
          (googlePlaceholderIndex + 1) %
          googlePlaceholders.length;

        googleTypingTimer =
          setTimeout(showGoogleSuggestion, 5000);
      }, 3000);
  }

  typeText();
}

if (googleSearchInput) {
  googleSearchInput.addEventListener(
    "focus",
    resetGooglePlaceholder
  );

  googleSearchInput.addEventListener(
    "input",
    resetGooglePlaceholder
  );
}

const accountNavBtn =
  document.getElementById("accountNavBtn");

if (accountNavBtn) {
  accountNavBtn.addEventListener(
    "click",
    resetGooglePlaceholder
  );
}

resetGooglePlaceholder();

if (googleSearchForm) {

  googleSearchForm.addEventListener(
    "submit",
    (e) => {

      e.preventDefault();

      const keyword =
        googleSearchInput.value.trim();

      if (!keyword) {
        alert("Masukkan kata pencarian");
        return;
      }

      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
        "_blank"
      );
    }
  );
}

if (openSpreadsheetBtn) {

  openSpreadsheetBtn.addEventListener(
    "click",
    async () => {

      const originalText =
        openSpreadsheetBtn.innerHTML;

      openSpreadsheetBtn.disabled =
        true;

      openSpreadsheetBtn.innerHTML =
        `
        <i
          class="
          ri-loader-4-line
          rotating
          "
        ></i>

        Memuat...
        `;

      try {

        const response =
          await fetch(
            SCRIPT_URL,
            {
              method: "POST",

              body: JSON.stringify({
                action: "config"
              })
            }
          );

        const data =
          await response.json();

        if (
          !data.spreadsheetUrl
        ) {

          alert(
            "Link spreadsheet belum tersedia"
          );

          return;
        }

        window.open(
          data.spreadsheetUrl,
          "_blank"
        );

      } catch (error) {

        console.error(
          error
        );

        alert(
          "Gagal membuka spreadsheet"
        );

      } finally {

        openSpreadsheetBtn
          .disabled = false;

        openSpreadsheetBtn
          .innerHTML =
            originalText;
      }
    }
  );
}

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    () => {

      const confirmLogout =
        confirm(
          "Yakin ingin logout?"
        );

      if (!confirmLogout) return;

      if (
        localStorage.getItem(
          "aqila_remember"
        ) !== "true"
      ) {

        localStorage.removeItem(
          "aqila_role"
        );

        localStorage.removeItem(
          "aqila_name"
        );
      }

      localStorage.removeItem(
        "aqila_last_active"
      );

      localStorage.setItem(
        "aqila_logged_out",
        "true"
      );

      location.reload();
    }
  );
}

window.addEventListener(
  "load",
  () => {

    if (

      localStorage.getItem(
        "aqila_remember"
      ) === "true"

    ) {

      document.getElementById(
        "rememberMe"
      ).checked = true;

      const savedName =
        localStorage.getItem(
          "aqila_name"
        );

      if (savedName) {

        document.getElementById(
          "nameInput"
        ).value =
          savedName;
      }

      const savedRole =
        localStorage.getItem(
          "aqila_role"
        );

      if (savedRole) {

        document.getElementById(
          "role"
        ).value =
          savedRole;

        document.getElementById(
          "selectedText"
        ).innerText = {

          player:
            "Player",

          vocal:
            "Vocal",

          lainnya:
            "Lainnya"

        }[savedRole];
      }

    }

    const role =
      localStorage.getItem(
        "aqila_role"
      );

      const lastActive =
      localStorage.getItem(
        "aqila_last_active"
      );

    if (
      role &&
      lastActive
    ) {

      const diff =
        Date.now() - Number(lastActive);

      if (diff >= SESSION_TIMEOUT) {

        localStorage.removeItem(
          "aqila_role"
        );

        localStorage.removeItem(
          "aqila_last_active"
        );

        alert(
          "Sesi login telah berakhir"
        );

        location.reload();

        return;
      }
    }

    if (
      role &&
      localStorage.getItem(
        "aqila_last_active"
      ) &&
      localStorage.getItem(
        "aqila_logged_out"
      ) !== "true"
    ) {

      showApp(role);

      const savedTab =
        localStorage.getItem(
          "aqila_tab"
        );

      if (savedTab) {

        navBtns.forEach(btn => {

          btn.classList.remove(
            "active"
          );

          if (
            btn.dataset.target ===
            savedTab
          ) {

            btn.classList.add(
              "active"
            );
          }
        });

        sections.forEach(section => {

          section.classList.remove(
            "active"
          );
        });

        document
          .getElementById(savedTab)
          .classList.add("active");

        setTimeout(() => {

          scrollToTop();

        }, 100);
      }
    }
  }
);
const requestForm =
  document.getElementById(
    "requestForm"
  );

function isValidInput(text) {

  return /^[a-zA-Z0-9\s\-()+±#\/.,]+$/.test(text);
}

requestForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    if (isSendingRequest) return;

    const namaLagu =
      document.getElementById(
        "namaLagu"
      ).value.trim();

    const catatan =
      document.getElementById(
        "catatan"
      ).value.trim();

    if (!namaLagu) {

      alert(
        "Nama lagu wajib diisi"
      );

      return;
    }

if (!isValidInput(namaLagu)) {

  alert(
    "Nama lagu berisi karakter yang tidak didukung"
  );

  return;
}

    if (namaLagu.length > 30) {

      alert(
        "Nama lagu maksimal 30 karakter"
      );

      return;
    }

if (
  catatan &&
  !isValidInput(catatan)
) {

  alert(
    "Catatan berisi karakter yang tidak didukung"
  );

  return;
}

    if (catatan.length > 100) {

      alert(
        "Catatan maksimal 100 karakter"
      );

      return;
    }

    const confirmRequest =
      confirm(
        "Kirim request lagu ini?"
      );

    if (!confirmRequest) return;

    const role =
      localStorage.getItem(
        "aqila_role"
      );

    const roleLabel = {
      player: "Player",
      vocal: "Vocal",
      lainnya: "Guest"
    };

    try {
      const loadingStart =
        Date.now();

      isSendingRequest = true;

      requestBtn.disabled = true;

      requestBtn.innerHTML = `
        <i class="ri-loader-4-line rotating"></i>
        Memeriksa...
      `;

      const response =
        await fetch(
          SCRIPT_URL,
          {
            method: "POST",

            body: JSON.stringify({
              action: "addRequest",

              namaLagu,
              catatan,

              requestBy:
              `${localStorage.getItem(
                "aqila_name"
              )} (${roleLabel[role]})`
            })
          }
        );

      const result =
        await response.json();

        const elapsed =
          Date.now() - loadingStart;

        const minLoading =
          1000;

        if (elapsed < minLoading) {

          await new Promise(resolve =>
            setTimeout(
              resolve,
              minLoading - elapsed
            )
          );
        }

      if (!result.success) {

        alert(result.message);

        requestBtn.disabled = false;

        requestBtn.innerText =
          "Kirim Request";

        isSendingRequest = false;

        return;
      }

      localStorage.setItem(
        "aqila_last_request",
        Date.now()
      );

      alert(
        "Request berhasil dikirim 🔥"
      );

      isSendingRequest = false;
      
      updateRequestCooldown();

      requestForm.reset();

      namaCounter.textContent =
        "0/30";

      catatanCounter.textContent =
        "0/100";

      loadRequestData();

    } catch (error) {

      console.error(error);

      alert(
        "Gagal mengirim request"
      );

      requestBtn.disabled = false;

      requestBtn.innerText =
        "Kirim Request";
    }

    isSendingRequest = false;
  }
);

const themeToggle =
  document.getElementById(
    "themeToggle"
  );

const themeToggleApp =
  document.getElementById(
    "themeToggleApp"
  );

function updateThemeIcon(
  animate = false
) {

  const isDark =
    document.body.classList.contains(
      "dark"
    );

  const icons =
    [
      themeToggle,
      themeToggleApp
    ];

  icons.forEach(btn => {

    if (!btn) return;

    btn.innerHTML =
      isDark
        ? '<i class="ri-moon-line"></i>'
        : '<i class="ri-sun-line"></i>';
        const icon =
      btn.querySelector("i");

      if (animate) {

        icon.classList.remove(
          "theme-icon-animate"
        );

        icon.offsetHeight;

        icon.classList.add(
          "theme-icon-animate"
        );
      }
  });
}

function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );

  const isDark =
    document.body.classList.contains(
      "dark"
    );

  localStorage.setItem(
    "aqila_theme",
    isDark ? "dark" : "light"
  );
  updateThemeIcon(true);
}

if (themeToggle) {

  themeToggle.addEventListener(
    "click",
    toggleTheme
  );
}

if (themeToggleApp) {

  themeToggleApp.addEventListener(
    "click",
    toggleTheme
  );
}

window.addEventListener(
  "load",
  () => {

    const savedTheme =
      localStorage.getItem(
        "aqila_theme"
      );

    if (savedTheme === "dark") {

      document.body.classList.add(
        "dark"
      );
    }

    updateThemeIcon();
  }
);

const customSelect =
  document.getElementById(
    "customSelect"
  );

const selectedText =
  document.getElementById(
    "selectedText"
  );

const roleInput =
  document.getElementById(
    "role"
  );

const options =
  document.querySelectorAll(
    ".select-option"
  );

if (customSelect) {

  customSelect.addEventListener(
    "click",
    (e) => {

      e.stopPropagation();

      if (
        customSelect.classList.contains(
          "closing"
        )
      ) return;

      customSelect.classList.toggle(
        "active"
      );
    }
  );
}

options.forEach(option => {

  option.addEventListener(
    "click",
    (e) => {

      e.stopPropagation();

      const value =
        option.dataset.value;

      const text =
        option.innerText;

      selectedText.innerText =
        text;

      roleInput.value =
        value;

      customSelect.classList.add(
        "closing"
      );

      customSelect.classList.remove(
        "active"
      );

      setTimeout(() => {

        customSelect.classList.remove(
          "closing"
        );

      }, 250);
    }
  );
});

const namaLaguInput =
  document.getElementById(
    "namaLagu"
  );

const catatanInput =
  document.getElementById(
    "catatan"
  );

catatanInput.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Enter") {

      e.preventDefault();
    }
  }
);

const namaCounter =
  document.getElementById(
    "namaCounter"
  );

const catatanCounter =
  document.getElementById(
    "catatanCounter"
  );

const togglePassword =
  document.getElementById(
    "togglePassword"
  );

const passwordInput =
  document.getElementById(
    "password"
  );

if (
  togglePassword &&
  passwordInput
) {

  togglePassword.addEventListener(
    "click",
    () => {

      const isPassword =
        passwordInput.type ===
        "password";

      passwordInput.type =
        isPassword
          ? "text"
          : "password";

      togglePassword.innerHTML =
        isPassword
          ? '<i class="ri-eye-off-line"></i>'
          : '<i class="ri-eye-line"></i>';
    }
  );
}

namaLaguInput.addEventListener(
  "input",
  () => {

    namaCounter.textContent =
      `${namaLaguInput.value.length}/30`;
  }
);

catatanInput.addEventListener(
  "input",
  () => {

    catatanCounter.textContent =
      `${catatanInput.value.length}/100`;
  }
);

function updateRequestCooldown() {

  if (isSendingRequest) return;
  if (!requestBtn) return;

  const lastRequest =
    localStorage.getItem(
      "aqila_last_request"
    );

  if (!lastRequest) {

    requestBtn.disabled = false;

    requestBtn.innerText =
      "Kirim Request";

    return;
  }

  const cooldown =
    1 * 60 * 1000;

  const now = Date.now();

  const diff =
    now - Number(lastRequest);

  if (diff >= cooldown) {

    requestBtn.disabled = false;

    requestBtn.innerText =
      "Kirim Request";

    return;
  }

  const remain =
    cooldown - diff;

  const minutes =
    Math.floor(
      remain / 60000
    );

  const seconds =
    Math.floor(
      (remain % 60000) / 1000
    );

  requestBtn.disabled = true;

  requestBtn.innerText =
    `Tunggu ${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
}

const notifModal =
  document.getElementById(
    "notifModal"
  );

const notifImage =
  document.getElementById(
    "notifImage"
  );

const notifClose =
  document.getElementById(
    "notifClose"
  );

const notifBtn =
  document.querySelector(
    ".ri-notification-3-line"
  ).parentElement;

const notifBadge =
  document.getElementById(
    "notifBadge"
  );

notifBtn.addEventListener(
  "click",
  () => {

    if (!notificationImages.length) {

      alert(
        "Notifikasi belum tersedia"
      );

      return;
    }

    notifBadge.style.display =
      "none";

    notifOpened = true;

    currentNotifIndex = 0;

    notifTrack.innerHTML = "";

    notifDots.innerHTML = "";

    notificationImages.forEach(
      (src, index) => {

        const slide =
          document.createElement("div");

        slide.className =
          "notif-slide";

        slide.innerHTML = `
          <img
            src="${src.image}"
            draggable="false"
          >
        `;

        const img =
          slide.querySelector("img");

        img.addEventListener(
          "load",
          () => {

            const canvas =
              document.createElement(
                "canvas"
              );

            const ctx =
              canvas.getContext("2d");

            canvas.width = 1;
            canvas.height = 1;

            ctx.drawImage(
              img,
              0,
              0,
              1,
              1
            );

            const pixel =
              ctx.getImageData(
                0,
                0,
                1,
                1
              ).data;

            const color =
              `rgba(
                ${pixel[0]},
                ${pixel[1]},
                ${pixel[2]},
                .45
              )`;

            slide.style.border =
              `1px solid ${color}`;
          }
        );

        if (src.link) {

          slide.style.cursor =
            "pointer";

          slide.addEventListener(
            "click",
            () => {

              if (notifDragged) return;

              window.open(
                src.link,
                "_blank"
              );
            }
          );
        }

        notifTrack.appendChild(
          slide
        );

        const dot =
          document.createElement("div");

        dot.className =
          "notif-dot";

        if (index === 0) {

          dot.classList.add(
            "active"
          );
        }

        dot.addEventListener(
          "click",
          () => {

            currentNotifIndex = index;

            notifTrack.style.transition =
              "transform .45s ease";

            updateNotifSlider();

            pauseNotifAutoplay();
          }
        );

        notifDots.appendChild(dot);
      }
    );

    updateNotifSlider();

    notifModal.classList.remove(
      "hidden"
    );

    notifClose.classList.remove(
      "hide"
    );

    notifClose.classList.add(
      "show"
    );

    document.body.classList.add(
      "modal-open"
    );

    document.documentElement.classList.add(
      "modal-open"
    );

    clearInterval(notifInterval);

    if (
      notificationImages.length > 1
    ) {

      startNotifAutoplay();
    }
  }
);

notifClose.addEventListener(
  "click",
  () => {

    notifModal.classList.add(
      "hidden"
    );

    notifClose.classList.remove(
      "show"
    );

    notifClose.classList.add(
      "hide"
    );

    document.body.classList.remove(
      "modal-open"
    );

    document.documentElement.classList.remove(
      "modal-open"
    );

    notifOpened = false;

    if (notificationImages.length) {

      notifBadge.style.display =
        "flex";
    }

    clearInterval(
      notifInterval
    );
  }
);

function notifPointerStart(x) {

  isDragging = true;

  notifDragged = false;

  notifStartX = x;

  notifMoveX = x;

  pauseNotifAutoplay();
}

function notifPointerMove(x) {

  if (!isDragging) return;

  notifMoveX = x;

  if (
    Math.abs(
      notifStartX - notifMoveX
    ) > 10
  ) {

    notifDragged = true;
  }
}

function notifPointerEnd() {

  if (!isDragging) return;

  isDragging = false;

  const diff =
    notifStartX - notifMoveX;

  if (Math.abs(diff) < 50) {

    isDragging = false;

    return;
  }

  if (diff > 0) {

    currentNotifIndex++;

  if (
    currentNotifIndex >=
    notificationImages.length
  ) {

    currentNotifIndex = 0;
  }

  } else {

    currentNotifIndex--;

    if (currentNotifIndex < 0) {

      currentNotifIndex = 0;
    }
  }

  notifTrack.style.transition =
    "transform .45s ease";

  updateNotifSlider();

  setTimeout(() => {

    notifDragged = false;

  }, 100);
}

notifTrack.addEventListener(
  "touchstart",
  (e) => {

    notifPointerStart(
      e.touches[0].clientX
    );
  }
);

notifTrack.addEventListener(
  "touchmove",
  (e) => {

    notifPointerMove(
      e.touches[0].clientX
    );
  }
);

notifTrack.addEventListener(
  "touchend",
  notifPointerEnd
);

notifTrack.addEventListener(
  "mousedown",
  (e) => {

    e.preventDefault();

    notifPointerStart(
      e.clientX
    );
  }
);

notifTrack.addEventListener(
  "mousemove",
  (e) => {

    if (!isDragging) return;

    e.preventDefault();

    notifPointerMove(
      e.clientX
    );
  }
);

notifTrack.addEventListener(
  "mouseup",
  notifPointerEnd
);

notifTrack.addEventListener(
  "mouseleave",
  () => {

    if (isDragging) {

      notifPointerEnd();
    }
  }
);

setInterval(
  updateRequestCooldown,
  1000
);

setInterval(() => {

  const role =
    localStorage.getItem(
      "aqila_role"
    );

  if (!role) return;

  loadRequestData();

  loadSongData(role);

  loadNotification();

}, 5000);

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => {

        console.log("PWA aktif");
      });
  });
}

updateRequestCooldown();

function resetSessionTimer() {

  localStorage.setItem(
    "aqila_last_active",
    Date.now()
  );

  clearTimeout(sessionTimer);

  const role =
    localStorage.getItem(
      "aqila_role"
    );

  if (!role) return;

  sessionTimer =
    setTimeout(() => {

      alert(
        "Sesi berakhir, silakan login kembali"
      );

      localStorage.removeItem(
        "aqila_role"
      );
      localStorage.removeItem(
        "aqila_last_active"
      );

      location.reload();

    }, SESSION_TIMEOUT);
}

function initSessionListener() {

  [
    "click",
    "touchstart",
    "keydown",
    "scroll"
  ].forEach(event => {

    document.addEventListener(
      event,
      resetSessionTimer
    );
  });

  resetSessionTimer();
}

window.addEventListener(
  "resize",
  () => {

    renderRequestTable(
      allRequestData
    );

    applySongFilter();

  }
);

const versionBtn =
  document.getElementById(
    "versionBtn"
  );

if (versionBtn) {

  versionBtn.addEventListener(
    "click",
    () => {

      alert(
        `AQILA MUSIC\nVersi ${APP_VERSION}`
      );

    }
  );
}

const changePasswordBtn =
  document.getElementById(
    "changePasswordBtn"
  );

if (changePasswordBtn) {

  changePasswordBtn
    .addEventListener(
      "click",
      () => {

        alert(
          "Ubah password belum tersedia."
        );

      }
    );
}

const printSongBtn =
  document.getElementById(
    "printSongBtn"
  );

if (printSongBtn) {

  printSongBtn.addEventListener(
    "click",
    () => {

      if (
        !allSongData ||
        allSongData.length === 0
      ) {

        alert(
          "Daftar lagu belum dimuat"
        );

        return;
      }

      window.print();
    }
  );
}

const nameInput =
  document.getElementById(
    "nameInput"
  );

if (nameInput) {

  nameInput.addEventListener(
    "input",

    function () {

      this.value =

        this.value

        .replace(
          /[^A-Za-z\s]/g,
          ""
        )

        .replace(
          /^\s+/,
          ""
        )

        .replace(
          /\s{2,}/g,
          " "
        )

        .slice(
          0,
          15
        );

    }
  );
}