const APP_VERSION =
  "1.1.3";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzymZrpNF4UG6490DdCbM0bnqg86HCJF7LLaOvOZSSithJg__VkPNtzXkj4bLd3vRU/exec";

let currentRequestPage = 1;
let currentSongPage = {};
let isPrintMode = false;

let allSongData = [];
let songLoaded = false;
let allRequestData = [];
let requestLoaded = false;
let selectAnimating = false;

let currentRole = "";
let lastRenderedRole = "";

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
let isForceLoggingOut = false;

let isSwitchingRole = false;

function setRoleSwitchLoading(isLoading) {
  isSwitchingRole = isLoading;
  document.body.classList.toggle("role-switch-loading", isLoading);
}

const SESSION_TIMEOUT =
  60 * 60 * 1000;

const MAX_SESSION_DURATION =
  8 * 60 * 60 * 1000;

let sessionTimer = null;

let sessionListenerInit =
  false;

function normalizeRole(role) {

  return String(role || "")
    .trim()
    .toLowerCase();
}

function getActiveRole() {

  const role =
    normalizeRole(
      currentRole ||
      localStorage.getItem("aqila_role")
    );

  if (
    role === "player" ||
    role === "playerplus" ||
    role === "vocal" ||
    role === "lainnya"
  ) {

    return role;
  }

  if (
    document.body.classList.contains(
      "player-mode"
    )
  ) {

    return "player";
  }

  if (
    document.body.classList.contains(
      "vocal-mode"
    )
  ) {

    return "vocal";
  }

  return "lainnya";
}

function appPopup({
  title = "Informasi",
  message = "",
  type = "info",
  confirmText = "OK",
  cancelText = "Batal",
  showCancel = false
}) {

  return new Promise(resolve => {

    const oldPopup =
      document.getElementById(
        "appPopupModal"
      );

    if (oldPopup) {
      oldPopup.remove();
    }

    const iconMap = {
      success: "ri-checkbox-circle-fill",
      error: "ri-close-circle-fill",
      warning: "ri-error-warning-fill",
      info: "ri-information-fill",
      question: "ri-question-fill"
    };

    const modal =
      document.createElement("div");

    modal.id =
      "appPopupModal";

    modal.className =
      `app-popup-modal ${type}`;

    modal.innerHTML = `
      <div class="app-popup-overlay"></div>

      <div class="app-popup-box">

        <div class="app-popup-icon">
          <i class="${iconMap[type] || iconMap.info}"></i>
        </div>

        <h3>
          ${title}
        </h3>

        <p>
          ${message}
        </p>

        <div class="app-popup-actions ${showCancel ? "two" : ""}">

          ${
            showCancel
              ? `
                <button
                  type="button"
                  class="app-popup-btn cancel"
                  id="appPopupCancel"
                >
                  ${cancelText}
                </button>
              `
              : ""
          }

          <button
            type="button"
            class="app-popup-btn confirm"
            id="appPopupConfirm"
          >
            ${confirmText}
          </button>

        </div>

      </div>
    `;

    const popupScrollY =
      window.scrollY ||
      document.documentElement.scrollTop;

    document.body.appendChild(
      modal
    );

    document.body.style.top =
      `-${popupScrollY}px`;

    document.body.style.position =
      "fixed";

    document.body.style.width =
      "100%";

    document.body.classList.add(
      "modal-open"
    );

    document.documentElement.classList.add(
      "modal-open"
    );

    const closePopup = (result) => {

      modal.remove();

      document.body.classList.remove(
        "modal-open"
      );

      document.documentElement.classList.remove(
        "modal-open"
      );

      document.body.style.position =
        "";

      document.body.style.top =
        "";

      document.body.style.width =
        "";

      window.scrollTo(
        0,
        popupScrollY
      );

      resolve(result);
    };

    document
      .getElementById("appPopupConfirm")
      .addEventListener(
        "click",
        () => closePopup(true)
      );

    const cancelBtn =
      document.getElementById(
        "appPopupCancel"
      );

    if (cancelBtn) {

      cancelBtn.addEventListener(
        "click",
        () => closePopup(false)
      );
    }
  });
}

async function forceLogoutByAuthChange() {

  if (isForceLoggingOut)
    return;

  isForceLoggingOut =
    true;

  await appAlert(
    "Sesi berakhir karena ada pembaruan. Silakan login kembali.",
    "warning"
  );

  localStorage.removeItem(
    "aqila_role"
  );

  localStorage.removeItem(
    "aqila_last_active"
  );

  localStorage.removeItem(
    "aqila_login_time"
  );

  localStorage.removeItem(
    "aqila_yt_search_choice"
  );

  localStorage.removeItem(
    "aqila_tab"
  );

  sessionStorage.removeItem(
    "aqila_token"
  );

  location.reload();
}

function appAlert(
  message,
  type = "info",
  title = ""
) {

  const titleMap = {
    success: "Berhasil",
    error: "Gagal",
    warning: "Peringatan",
    info: "Informasi"
  };

  return appPopup({
    title: title || titleMap[type] || "Informasi",
    message,
    type,
    confirmText: "OK"
  });
}

function appConfirm(
  message,
  title = "Konfirmasi",
  confirmText = "Ya",
  cancelText = "Batal"
) {

  return appPopup({
    title,
    message,
    type: "question",
    confirmText,
    cancelText,
    showCancel: true
  });
}

function showPlayerPlusPinPopup() {

  return new Promise(resolve => {

    const old =
      document.getElementById(
        "playerPlusPinModal"
      );

    if (old)
      old.remove();

    const modal =
      document.createElement(
        "div"
      );

    modal.id =
      "playerPlusPinModal";

    modal.className =
      "playerplus-modal";

    modal.innerHTML = `
      <div class="playerplus-overlay"></div>

      <div class="playerplus-box">

        <div class="playerplus-icon">
          <i class="ri-shield-keyhole-fill"></i>
        </div>

        <h3>
          Masuk Player+
        </h3>

        <p>
          Masukkan PIN untuk akses edit lagu
        </p>

        <div class="pin-code-wrap">

          <input
            class="pin-box"
            type="tel"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
          >

          <input
            class="pin-box"
            type="tel"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
          >

          <input
            class="pin-box"
            type="tel"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
          >

          <input
            class="pin-box"
            type="tel"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
          >

        </div>

        <div class="playerplus-actions">

          <button
            id="playerPlusCancel"
            class="cancel"
          >
            Batal
          </button>

          <button
            id="playerPlusOk"
            class="ok"
          >
            Masuk
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    const inputs =
      modal.querySelectorAll(".pin-box");

    inputs[0].focus();

    let realPin = "";

    inputs.forEach((box, index) => {
      box.addEventListener("input", () => {
        const digit =
          box.value.replace(/\D/g, "").slice(-1);

        box.value = digit;

        realPin =
          [...inputs].map(i => i.dataset.value || "").join("");

        if (digit) {
          box.dataset.value = digit;

          setTimeout(() => {
            box.value = "•";
          }, 250);

          if (inputs[index + 1]) {
            inputs[index + 1].focus();
          }
        }
      });

      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          box.dataset.value = "";
          box.value = "";

          if (!box.value && inputs[index - 1]) {
            inputs[index - 1].focus();
          }
        }
      });
    });

    document
      .getElementById(
        "playerPlusCancel"
      )
      .onclick = () => {

        modal.remove();

        resolve(null);
      };

    const okBtn =
      document.getElementById(
        "playerPlusOk"
      );

    okBtn.disabled = true;

    inputs.forEach(box => {
      box.addEventListener("input", () => {
        const pin =
          [...inputs]
            .map(i => i.dataset.value || "")
            .join("");

        okBtn.disabled =
          pin.length !== 4;
      });
    });

    okBtn.onclick = () => {

      const val =
        [...inputs]
          .map(i =>
            i.dataset.value || ""
          )
          .join("");

      if (
        val.length !== 4
      ) return;

      modal.remove();

      resolve(val);
    };
  });
}

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

const SEARCH_ALLOWED_REGEX =
  /[^A-Za-z0-9\s\-()+±#\/.,'&]/g;

const WEB_SEARCH_ALLOWED_REGEX =
  /[^A-Za-z0-9\s\-()+±#\/.,'&!?@]/g;


function limitSearchInput(
  input,
  maxLength,
  regex = SEARCH_ALLOWED_REGEX
) {

  if (!input) return;

  input.setAttribute(
    "maxlength",
    maxLength
  );

  input.addEventListener(
    "input",
    () => {

      const oldValue =
        input.value;

      const newValue =
        oldValue
          .replace(
            regex,
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
            maxLength
          );

      if (oldValue !== newValue) {

        input.value =
          newValue;
      }
    },
    true
  );
}

limitSearchInput(
  songSearch,
  40
);

limitSearchInput(
  requestSearch,
  40
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

        songCategoryText.textContent =
          option.textContent.trim();

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

    requestFilter.classList.remove("active");

    if (songCategoryFilter) {
      songCategoryFilter.classList.remove("active");
    }

    if (customSelect) {
      customSelect.classList.remove("active");
    }

    document
      .querySelectorAll(".move-category-wrap")
      .forEach(el => {
        el.classList.remove("active");
      });
  }
);

function getSongItemsPerPage() {

  const h =
    window.innerHeight;

  let total;

  if (h <= 600) {
    total = 5;
  } else if (h <= 750) {
    total = 6;
  } else if (h <= 850) {
    total = 8;
  } else if (h <= 900) {
    total = 10;
  } else if (h <= 1050) {
    total = 12;
  } else if (h <= 1350) {
    total = 15;
  } else {
    total = 20;
  }

  if (
    window.innerWidth >= 650 ||
    isPrintMode
  ) {
    total *= 2;
  }

  return total;
}

function getRequestItemsPerPage() {

  const h =
    window.innerHeight;

  let total;

  if (h <= 700) {
    total = 3;
  } else if (h <= 800) {
    total = 5;
  } else if (h <= 900) {
    total = 7;
  } else if (h <= 1050) {
    total = 8;
  } else if (h <= 1250) {
    total = 10;
  } else if (h <= 1450) {
    total = 12;
  } else {
    total = 15;
  }

  if (window.innerWidth >= 768) {
    total *= 2;
  }

  return total;
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

    }, 2000);
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
      await appAlert(
        "Nama tidak boleh kosong",
        "warning"
      );
      return;
    }

    if (
      userName.length < 3
    ) {

      await appAlert(
        "Nama minimal 3 huruf",
        "warning"
      );

      return;
    }

    if (!role || !password) {

      await appAlert(
        "Lengkapi data login",
        "warning"
      );

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
        await appAlert(
          "Password salah",
          "error"
        );

        setLoginLoading(false);

        return;
      }

      sessionStorage.setItem(
        "aqila_token",
        result.token
      );

      localStorage.setItem(
        "aqila_role",
        role
      );

      localStorage.setItem(
        "aqila_login_time",
        Date.now()
      );

      fetch(
        SCRIPT_URL,

        {

          method:
            "POST",

          body:
            JSON.stringify({

              action:"saveLogin",

              token:
              sessionStorage.getItem(
              "aqila_token"
              ),

              name:userName

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

      await appAlert(
        "Login berhasil 🔥",
        "success"
      );

      setTimeout(() => {

        localStorage.setItem(
          "aqila_tab",
          "dashboardSection"
        );

        showApp(role, true);

      }, 300);

    } catch (error) {

      console.error(error);

      await appAlert(
        "Gagal login",
        "error"
      );

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

function applyRoleVisibility(role) {

  const isGeneral =
    role === "lainnya";

  const requestListCard =
    document.getElementById(
      "requestListCard"
    );

  if (requestListCard) {
    requestListCard.classList.remove(
      "hidden"
    );
  }

  if (openSpreadsheetBtn) {
    openSpreadsheetBtn.classList.remove(
      "hidden"
    );
  }

  if (changePasswordBtn) {
    changePasswordBtn.classList.toggle(
      "hidden",
      isGeneral
    );
  }
}

function showApp(role, showWelcome = false) {

  role =
    normalizeRole(role);

  if (
    role !== "player" &&
    role !== "playerplus" &&
    role !== "vocal" &&
    role !== "lainnya"
  ) {

    role =
      normalizeRole(
        localStorage.getItem("aqila_role")
      );
  }

  if (
    role !== "player" &&
    role !== "playerplus" &&
    role !== "vocal" &&
    role !== "lainnya"
  ) {

    return appAlert(
      "Role tidak valid, silakan login ulang",
      "error"
    );
  }

  currentRole = role;

  localStorage.setItem(
    "aqila_role",
    role
  );

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
    "playerplus-mode",
    "vocal-mode",
    "lainnya-mode"
  );

  document.body.classList.add(
    role + "-mode"
  );

  loginPage.classList.add("hidden");

  appPage.classList.remove("hidden");

const badgeMap = {
  player: "PLAYER",
  playerplus: "PLAYER+",
  vocal: "VOCAL"
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

roleBadge.onclick = async () => {

  const activeRole =
    getActiveRole();

  if (
    activeRole !== "player" &&
    activeRole !== "playerplus"
  ) return;

  if (isSwitchingRole) return;

  if (
    getActiveRole() ===
    "playerplus"
  ) {

    setRoleSwitchLoading(true);

    roleBadge.innerHTML = `
      <i class="ri-loader-4-line rotating"></i>
      <span>Memuat</span>
    `;

    roleBadge.classList.add(
      "badge-loading"
    );

    roleBadge.style.pointerEvents =
      "none";

    try {

      const response =
        await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "setPlayerMode",
            token: sessionStorage.getItem("aqila_token")
          })
        });

      const result =
        await response.json();

      if (!result.success) {
        await forceLogoutByAuthChange();
        return;
      }

      await new Promise(
        r => setTimeout(r, 1000)
      );

      currentRole =
        "player";

      localStorage.setItem(
        "aqila_role",
        "player"
      );

      roleBadge.classList.remove(
        "badge-loading"
      );

      roleBadge.style.pointerEvents =
        "";

      showApp("player");

    } catch (error) {

      console.error(error);

      await appAlert(
        "Gagal kembali ke Player",
        "error"
      );

      roleBadge.classList.remove(
        "badge-loading"
      );

      roleBadge.style.pointerEvents =
        "";
    }

    setRoleSwitchLoading(false);

    return;
  }

  const pin =
    await showPlayerPlusPinPopup();

  if (pin === null)
    return;

  setRoleSwitchLoading(true);

  roleBadge.innerHTML = `
    <i class="ri-loader-4-line rotating"></i>
    <span>Memuat</span>
  `;

  roleBadge.classList.add(
    "badge-loading"
  );

  roleBadge.style.pointerEvents =
    "none";

  try {

    const response =
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "verifyPlayerPlusPin",
          token: sessionStorage.getItem("aqila_token"),
          pin
        })
      });

    const result =
      await response.json();

    if (!result.success) {

      roleBadge.classList.remove(
        "badge-loading"
      );

      roleBadge.innerText =
        "PLAYER";

      roleBadge.style.pointerEvents =
        "";

      setRoleSwitchLoading(false);

      await appAlert(
        result.message || "PIN salah",
        "error"
      );

      return;
    }

    currentRole =
      "playerplus";

    localStorage.setItem(
      "aqila_role",
      "playerplus"
    );

    await appAlert(
      "Mode Player+ aktif",
      "success"
    );

    roleBadge.classList.remove(
      "badge-loading"
    );

    roleBadge.style.pointerEvents =
      "";

    showApp("playerplus");

    setRoleSwitchLoading(false);

  } catch (error) {

    console.error(error);

    roleBadge.classList.remove(
      "badge-loading"
    );

    roleBadge.innerText =
      "PLAYER";

    roleBadge.style.pointerEvents =
      "";

    setRoleSwitchLoading(false);

    await appAlert(
      "Gagal masuk Player+",
      "error"
    );
  }
};

  applyRoleVisibility(role);  
  loadSongData(role);

  loadRequestData();

  loadNotification();

  initSessionListener();

  if (showWelcome) {
    setTimeout(() => {
      showWelcomeSongCard();
    }, 800);
  }
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
      await fetch(SCRIPT_URL, {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          action: "songs",
          token: sessionStorage.getItem("aqila_token")
        })
      });

    const data =
      await response.json();

    if (
      data &&
      data.success === false &&
      data.message === "Unauthorized"
    ) {
      await forceLogoutByAuthChange();
      return;
    }

    if (!Array.isArray(data)) {
      setTimeout(() => {
        loadSongData(role);
      }, 3000);

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

    const activeRole =
      getActiveRole();

    if (
      !songLoaded ||
      newData !== oldData ||
      lastRenderedRole !== activeRole
    ) {
      allSongData = data;
      applySongFilter();
    }

    songLoaded = true;

  } catch (error) {
    console.error(error);

    setTimeout(() => {
      loadSongData(role);
    }, 3000);

  } finally {
    isLoadingSongs = false;
    clearTimeout(timeout);
  }
}

function getDefaultSongLink(songName) {

  const role =
    getActiveRole();

  const keyword =
    role === "player"
      ? "chordtela " + songName
      : "lirik " + songName;

  return `https://www.google.com/search?q=${encodeURIComponent(
    keyword
  )}`;
}

function normalizeSongLink(link) {

  const value =
    String(link || "").trim();

  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {

    return value;
  }

  return `https://${value}`;
}

function findSongLinkByName(songName) {
  const target =
    String(songName || "")
      .trim()
      .toLowerCase();

  if (!target) return "";

  const found =
    allSongData.find(song =>
      String(song["Nama Lagu"] || "")
        .trim()
        .toLowerCase() === target
    );

  if (!found) return "";

  return (
    found["Link"] ||
    found["LINK"] ||
    found["link"] ||
    ""
  );
}

function getRequestLink(item) {
  return (
    item["Link"] ||
    item["LINK"] ||
    item["link"] ||
    item["URL"] ||
    item["Url"] ||
    item["url"] ||
    item["Chord"] ||
    item["Lirik"] ||
    findSongLinkByName(item["Nama Lagu"]) ||
    ""
  );
}

function showSongLinkModal(songName, customLink) {

  const oldModal =
    document.getElementById(
      "songLinkModal"
    );

  if (oldModal) {
    oldModal.remove();
  }

  const finalLink =
    normalizeSongLink(customLink) ||
    getDefaultSongLink(songName);

  const role =
    getActiveRole();

  const songActionButton =
    role === "player"
      ? "Buka Chord"
      : "Buka Lirik";

  const modal =
    document.createElement("div");

  modal.id =
    "songLinkModal";

  modal.className =
    "yt-choice-modal";

  modal.innerHTML = `
    <div class="yt-choice-overlay"></div>

    <div class="yt-choice-box">

      <button
        type="button"
        class="yt-choice-close"
        id="songLinkClose"
      >
        <i class="ri-close-line"></i>
      </button>

      <div class="yt-choice-icon">
        <i class="ri-music-2-fill"></i>
      </div>

      <h3>
        Akses Lagu
      </h3>

      <p>
        ${songName}
      </p>

      <div class="song-link-actions">

        <button
          type="button"
          class="song-link-btn"
          id="songLinkOpen"
        >
          <i class="ri-search-eye-line"></i>
          ${songActionButton}
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  document
    .getElementById(
      "songLinkOpen"
    )
    .addEventListener(
      "click",
      () => {

        window.open(
          finalLink,
          "_blank"
        );

        modal.remove();
      }
    );

  document
    .getElementById(
      "songLinkClose"
    )
    .addEventListener(
      "click",
      () => {

        modal.remove();
      }
    );
}

function cleanEditSongValue(field, value) {

  let regex =
    /[^A-Za-z0-9\s\-()+±#\/.,"&?!]/g;

  let max =
    100;

  if (field === "Nama Lagu") {
    regex =
      /[^A-Za-z0-9\s\-()+±#\/.,"&]/g;
    max = 30;
  }

  if (
    field === "Nada Pria" ||
    field === "Nada Duet" ||
    field === "Nada Wanita"
  ) {

    value =
      String(value)
        .replace(/\+/g,"+")
        .replace(/\-\+/g,"±")
        .replace(/\+\-/g,"±")

    regex =
      /[^A-Ga-g#bBmM\s\/\-±+"()]/g;

    max = 12;
  }

  if (field === "Tempo") {

    value =
      String(value)
        .replace(/\-\+/g,"±")
        .replace(/\+\-/g,"±")

    regex =
      /[^0-9+\-±"\/()\s]/g;

    max = 8;
  }

  if (field === "Catatan") {
    regex =
      /[^A-Za-z0-9\s\-()+±#\/.,"&?!]/g;
    max = 100;
  }

  return String(value || "")
    .replace(regex, "")
    .replace(/^\s+/, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, max);
}

function getEditSongMaxLength(field) {

  if (field === "Nama Lagu")
    return 30;

  if (
    field === "Nada Pria" ||
    field === "Nada Duet" ||
    field === "Nada Wanita"
  )
    return 12;

  if (field === "Tempo")
    return 8;

  return 100;
}

function getSongValue(item, key) {
  const value = item[key];

  return value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
      ? String(value)
      : "-";
}

function showSongDetailPopup(item) {
  const old = document.getElementById("songDetailModal");

  if (old) old.remove();

  const modal = document.createElement("div");

  modal.id = "songDetailModal";
  modal.className = "edit-song-modal";

  const role = getActiveRole();

  const namaLagu = getSongValue(item, "Nama Lagu");
  const nadaPria = getSongValue(item, "Nada Pria");
  const nadaDuet = getSongValue(item, "Nada Duet");
  const nadaWanita = getSongValue(item, "Nada Wanita");
  const tempo = getSongValue(item, "Tempo");
  const catatan = getSongValue(item, "Catatan");
  const kategori = getSongValue(item, "Kategori");

  const isPlayerPlus =
    role === "playerplus";

  const isVocal =
    role === "vocal";

  modal.innerHTML = `
    <div class="edit-song-overlay"></div>

    <div class="edit-song-box">
      <div class="edit-song-scroll">

        <h3>Detail Lagu</h3>

        <div class="request-detail-list song-detail-list">

          ${isVocal ? `
            <div>
              <span>Nama Lagu</span>
              <strong>${namaLagu}</strong>
            </div>

            <div>
              <span>Kategori</span>
              <strong>${kategori}</strong>
            </div>

            <div>
              <span>Catatan</span>
              <strong>${catatan}</strong>
            </div>
          ` : `
            <div>
              <span>Nama Lagu</span>
              <strong>${namaLagu}</strong>
            </div>

            <div class="song-detail-two">
              <div>
                <span>Kategori</span>
                <strong>${kategori}</strong>
              </div>

              <div>
                <span>Tempo</span>
                <strong>${tempo}</strong>
              </div>
            </div>

            <div class="song-detail-three">
              <div>
                <span>Pria</span>
                <strong>${nadaPria}</strong>
              </div>

              <div>
                <span>Duet</span>
                <strong>${nadaDuet}</strong>
              </div>

              <div>
                <span>Wanita</span>
                <strong>${nadaWanita}</strong>
              </div>
            </div>

            <div>
              <span>Catatan</span>
              <strong>${catatan}</strong>
            </div>
          `}

        </div>

        <div class="song-detail-actions ${isPlayerPlus ? "" : "two"}">
          <button
            type="button"
            class="edit-song-cancel"
            id="songDetailCancel"
          >
            ${isPlayerPlus ? "Batal" : "Tutup"}
          </button>

          ${
            isPlayerPlus
              ? `
                <button
                  type="button"
                  class="song-delete-btn"
                  id="songDetailDelete"
                >
                  Hapus
                </button>

                <button
                  type="button"
                  class="edit-song-save"
                  id="songDetailEdit"
                >
                  Edit
                </button>
              `
              : `
                <button
                  type="button"
                  class="edit-song-save"
                  id="songDetailChord"
                >
                  ${isVocal ? "Lihat Lirik" : "Lihat Chord"}
                </button>

                <button
                  type="button"
                  class="edit-song-save"
                  id="songDetailComment"
                >
                  Komentar
                </button>
              `
          }
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
  lockBodyScroll();

  document.getElementById("songDetailCancel").onclick = () => {
    modal.remove();
    unlockBodyScroll();
  };

  if (!isPlayerPlus) {
    document.getElementById("songDetailChord").onclick = () => {
      const finalLink =
        normalizeSongLink(
          item["Link"] ||
          item["LINK"] ||
          item["link"]
        ) ||
        getDefaultSongLink(namaLagu);

      window.open(
        finalLink,
        "_blank"
      );

      modal.remove();
      unlockBodyScroll();
    };

    return;
  }

  document.getElementById("songDetailEdit").onclick = () => {
    modal.remove();
    showEditSongForm(item);
  };

  document.getElementById("songDetailDelete").onclick = async () => {
    const confirmDelete = await appConfirm(
      `Hapus lagu "${namaLagu}" dari daftar lagu?`,
      "Hapus Lagu",
      "Hapus",
      "Batal"
    );

    if (!confirmDelete) return;

    await deleteSong(item, modal);
  };
}

function showEditSongForm(item) {
  const old = document.getElementById("editSongModal");

  if (old) old.remove();

  const modal = document.createElement("div");

  modal.id = "editSongModal";
  modal.className = "edit-song-modal";

  const originalSongName =
    cleanEditSongValue("Nama Lagu", getSongValue(item, "Nama Lagu")).trim();

  modal.innerHTML = `
    <div class="edit-song-overlay"></div>

    <div class="edit-song-box edit-song-form-box">
      <div class="edit-song-scroll">

        <h3>Edit Lagu</h3>

        <div class="edit-form-detail-list">

          <div class="edit-form-card">
            <span>Kategori</span>

            <div class="move-category-wrap edit-category-top">
              <button
                type="button"
                id="editSongCategory"
                class="edit-category-btn"
                data-value="${item["Kategori"] || ""}"
              >
                <strong>${item["Kategori"] || "Pilih kategori"}</strong>
                <i class="ri-arrow-down-s-line"></i>
              </button>

              <div class="move-category-menu edit-category-menu">
                <button type="button" data-value="Trend 2026">Trend 2026</button>
                <button type="button" data-value="Trend 2025">Trend 2025</button>
                <button type="button" data-value="Trend 2024">Trend 2024</button>
                <button type="button" data-value="Trend 2023 Kebawah">Trend 2023 Kebawah</button>
                <button type="button" data-value="Lawasan V1">Lawasan V1</button>
                <button type="button" data-value="Lawasan V2">Lawasan V2</button>
                <button type="button" data-value="Campursari">Campursari</button>
                <button type="button" data-value="Religi">Religi</button>
              </div>
            </div>
          </div>

          <div class="edit-form-card">
            <span>Nama Lagu</span>
            <input
              id="editSongName"
              class="edit-detail-input"
              maxlength="30"
              value="${cleanEditSongValue("Nama Lagu", item["Nama Lagu"] || "")}"
            >
          </div>

          <div class="edit-form-three">
            <div class="edit-form-card">
              <span>Pria</span>
              <input
                id="editSongNadaPria"
                class="edit-detail-input"
                maxlength="12"
                value="${cleanEditSongValue("Nada Pria", item["Nada Pria"] || "")}"
              >
            </div>

            <div class="edit-form-card">
              <span>Duet</span>
              <input
                id="editSongNadaDuet"
                class="edit-detail-input"
                maxlength="12"
                value="${cleanEditSongValue("Nada Duet", item["Nada Duet"] || "")}"
              >
            </div>

            <div class="edit-form-card">
              <span>Wanita</span>
              <input
                id="editSongNadaWanita"
                class="edit-detail-input"
                maxlength="12"
                value="${cleanEditSongValue("Nada Wanita", item["Nada Wanita"] || "")}"
              >
            </div>
          </div>

          <div class="edit-form-card">
            <span>Tempo</span>
            <input
              id="editSongTempo"
              class="edit-detail-input"
              maxlength="8"
              value="${cleanEditSongValue("Tempo", item["Tempo"] || "")}"
            >
          </div>

          <div class="edit-form-card">
            <span>Catatan</span>
            <textarea
              id="editSongNote"
              class="edit-detail-textarea"
              maxlength="100"
            >${cleanEditSongValue("Catatan", item["Catatan"] || "")}</textarea>
          </div>

        </div>

        <div class="edit-form-actions">
          <button
            type="button"
            class="edit-song-cancel"
            id="editSongCancel"
          >
            Batal
          </button>

          <button
            type="button"
            class="edit-song-save"
            id="editSongSave"
          >
            Simpan
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
  lockBodyScroll();

  const nameInput = document.getElementById("editSongName");
  const categoryInput = document.getElementById("editSongCategory");
  const categoryMenu = modal.querySelector(".move-category-menu");
  const categoryText = categoryInput.querySelector("strong");

  categoryInput.onclick = (e) => {
    e.stopPropagation();

    const wrap =
      categoryInput.parentElement;

    const isOpen =
      wrap.classList.contains("active");

    wrap.classList.toggle("active");

    if (!isOpen) {

      requestAnimationFrame(() => {

        const current =
          categoryInput.dataset.value;

        const selected =
          categoryMenu.querySelector(
            `button[data-value="${current}"]`
          );

        if (selected) {
          selected.scrollIntoView({
            block: "center",
            behavior: "instant"
          });
        }

      });

    }
  };

  categoryMenu.querySelectorAll("button").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();

      categoryInput.dataset.value =
        btn.dataset.value;

      categoryText.innerText =
        btn.dataset.value;

      categoryInput
        .parentElement
        .classList
        .remove("active");

      checkChanges();
    };
  });

  const nadaPria = document.getElementById("editSongNadaPria");
  const nadaDuet = document.getElementById("editSongNadaDuet");
  const nadaWanita = document.getElementById("editSongNadaWanita");
  const tempoInput = document.getElementById("editSongTempo");
  const noteInput = document.getElementById("editSongNote");

  const saveBtn =
  document.getElementById("editSongSave");

let confirmSave = false;

const originalData = {
  kategori: categoryInput.dataset.value,
  nama: nameInput.value.trim(),
  pria: nadaPria.value.trim(),
  duet: nadaDuet.value.trim(),
  wanita: nadaWanita.value.trim(),
  tempo: tempoInput.value.trim(),
  catatan: noteInput.value.trim()
};

function checkChanges() {

  const changed =
    originalData.kategori !== categoryInput.dataset.value ||
    originalData.nama !== nameInput.value.trim() ||
    originalData.pria !== nadaPria.value.trim() ||
    originalData.duet !== nadaDuet.value.trim() ||
    originalData.wanita !== nadaWanita.value.trim() ||
    originalData.tempo !== tempoInput.value.trim() ||
    originalData.catatan !== noteInput.value.trim();

  saveBtn.disabled = !changed;

  if (!changed) {
    saveBtn.innerHTML = "Simpan";
    confirmSave = false;
  }

  if (changed && confirmSave) {
    saveBtn.innerHTML = "Simpan";
    confirmSave = false;
  }
}

saveBtn.disabled = true;

  nameInput.addEventListener("input", () => {
    nameInput.value = cleanEditSongValue("Nama Lagu", nameInput.value);
    checkChanges();
  });

  [nadaPria, nadaDuet, nadaWanita].forEach(input => {
    input.addEventListener("input", () => {
      input.value = cleanEditSongValue("Nada Pria", input.value);
      checkChanges();
    });
  });

  tempoInput.addEventListener("input", () => {
    tempoInput.value = cleanEditSongValue("Tempo", tempoInput.value);
    checkChanges();
  });

  noteInput.addEventListener("input", () => {
    noteInput.value = cleanEditSongValue("Catatan", noteInput.value);
    checkChanges();
  });

  document.getElementById("editSongCancel").onclick = () => {
    modal.remove();
    unlockBodyScroll();
  };

  saveBtn.onclick = async () => {

    if (!confirmSave) {

      confirmSave = true;

      saveBtn.innerHTML = "Yakin?";

      setTimeout(() => {

        if (confirmSave) {

          confirmSave = false;
          saveBtn.innerHTML = "Simpan";

        }

      }, 3000);

      return;
    }

    confirmSave = false;

    const cancelBtn =
      document.getElementById("editSongCancel");

    const payload = {
      "Kategori": categoryInput.dataset.value,
      "Nama Lagu": cleanEditSongValue("Nama Lagu", nameInput.value).trim(),
      "Nada Pria": cleanEditSongValue("Nada Pria", nadaPria.value).trim(),
      "Nada Duet": cleanEditSongValue("Nada Duet", nadaDuet.value).trim(),
      "Nada Wanita": cleanEditSongValue("Nada Wanita", nadaWanita.value).trim(),
      "Tempo": cleanEditSongValue("Tempo", tempoInput.value).trim(),
      "Catatan": cleanEditSongValue("Catatan", noteInput.value).trim()
    };

    if (!payload["Nama Lagu"]) {
      await appAlert("Nama lagu wajib diisi", "warning");
      return;
    }

    if (!payload["Kategori"]) {
      await appAlert("Pilih kategori dulu", "warning");
      return;
    }

    saveBtn.disabled = true;
    cancelBtn.disabled = true;

    modal.classList.add("form-loading");

    saveBtn.innerHTML = `
      <i class="ri-loader-4-line rotating"></i>
      Menyimpan...
    `;

    try {
      const fields = Object.keys(payload);

      for (const field of fields) {
        const oldValue = cleanEditSongValue(
          field,
          item[field] || ""
        ).trim();

        const newValue = payload[field];

        if (newValue === oldValue) continue;

        const response = await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "updateSong",
            token: sessionStorage.getItem("aqila_token"),
            songName: originalSongName,
            field,
            value: newValue
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Gagal mengubah data lagu");
        }
      }

      modal.remove();
      unlockBodyScroll();

      await appAlert("Data lagu berhasil diubah", "success");

      allSongData = allSongData.map(song => {
        if (
          String(song["Nama Lagu"]).trim() ===
          String(originalSongName).trim()
        ) {
          return {
            ...song,
            ...payload
          };
        }

        return song;
      });

      applySongFilter();

    } catch (error) {
      console.error(error);

      await appAlert(
        error.message || "Gagal menyimpan data lagu",
        "error"
      );

      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      modal.classList.remove("form-loading");
      saveBtn.innerHTML = "Simpan";
    }
  };
}

async function deleteSong(item, modal) {
  const songName =
    cleanEditSongValue("Nama Lagu", item["Nama Lagu"] || "").trim();

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "deleteSong",
      token: sessionStorage.getItem("aqila_token"),
      songName
    })
  });

  const result = await response.json();

  if (!result.success) {
    await appAlert(
      result.message || "Gagal menghapus lagu",
      "error"
    );
    return;
  }

  modal.remove();
  unlockBodyScroll();

  await appAlert("Lagu berhasil dihapus", "success");

  allSongData = allSongData.filter(song =>
    String(song["Nama Lagu"]).trim() !== String(songName).trim()
  );

  applySongFilter();
}

function renderTable(data, role) {

  role =
    normalizeRole(role);

    if (
    role !== "player" &&
    role !== "playerplus" &&
    role !== "vocal" &&
    role !== "lainnya"
  ) {

    role =
      getActiveRole();
  }

  lastRenderedRole =
    role;

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

  let keys = [
    "Nama Lagu"
  ];

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

    let paginatedData = filteredData;

    if (!isPrintMode) {

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

      paginatedData =
        filteredData.slice(
          start,
          end
        );
    }

    const table =
      document.createElement("table");

    const isDoubleColumn =
      window.innerWidth >= 650 ||
      isPrintMode;

    if (isDoubleColumn) {

      table.innerHTML = `
        <thead>
          <tr>
            <th colspan="2">Nama Lagu</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody =
        table.querySelector("tbody");

      const half =
        Math.ceil(
          paginatedData.length / 2
        );

      for (
        let i = 0;
        i < half;
        i++
      ) {

        const tr =
          document.createElement("tr");

        const lagu1 =
          paginatedData[i];

        const lagu2 =
          paginatedData[
            i + half
          ];

        [lagu1, lagu2].forEach(item => {

          const td =
            document.createElement("td");

          if (item) {

            const value =
              item["Nama Lagu"] || "-";

            td.textContent =
              value;

            td.classList.add(
              "text-left",
              "song-title-link"
            );

            td.addEventListener(
              "click",
              () => {
                const activeRole =
                  getActiveRole();

                if (
                  activeRole === "playerplus" ||
                  activeRole === "player" ||
                  activeRole === "vocal"
                ) {
                  showSongDetailPopup(item);
                  return;
                }

                showSongLinkModal(
                  value,
                  item["Link"] ||
                  item["LINK"] ||
                  item["link"]
                );
              }
            );

          } else {

            td.textContent = "";
            td.classList.add("empty-song-cell");
          }

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      }

      wrapper.appendChild(table);
      card.appendChild(wrapper);

      if (!isPrintMode) {
        const pagination =
          document.createElement("div");

        pagination.className =
          "pagination";

        card.appendChild(pagination);

        renderSongPagination(
          pagination,
          filteredData.length,
          category
        );
      }

      songTables.appendChild(card);

      return;
    }

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

        if (
          key === "Nama Lagu" &&
          getActiveRole() !== "playerplus" &&
          getActiveRole() !== "player" &&
          getActiveRole() !== "vocal"
        ) {

          td.classList.add(
            "text-left",
            "song-title-link"
          );

          td.title =
            "Klik untuk membuka link lagu";

          td.addEventListener(
            "click",
            () => {

              const songName =
                String(value || "").trim();

              if (
                !songName ||
                songName === "-"
              ) return;

              showSongLinkModal(
                songName,
                item["Link"] ||
                item["LINK"] ||
                item["link"]
              );
            }
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

      if (
        getActiveRole() === "playerplus" ||
        getActiveRole() === "player" ||
        getActiveRole() === "vocal"
      ) {
        tr.classList.add("editable-song-row");

        tr.addEventListener("click", () => {
          showSongDetailPopup(item);
        });
      }

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    wrapper.appendChild(table);

    card.appendChild(wrapper);

    if (!isPrintMode) {

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
    }

    songTables.appendChild(
      card
    );
  });

    setTimeout(() => {
    document
      .querySelectorAll("#songTables .table-responsive")
      .forEach((el, index) => {
        el.scrollLeft = 0;
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
    getActiveRole()
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

          cache: "no-store",

          signal:
            controller.signal,

          body: JSON.stringify({
            action: "requests",
            token: sessionStorage.getItem("aqila_token")
          })
        }
      );
    
    const data =
      await response.json();

    if (
      data &&
      data.success === false &&
      data.message === "Unauthorized"
    ) {
      await forceLogoutByAuthChange();
      return;
    }

  if (
    Array.isArray(data) &&
    data.length > 0
  ) {

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

  } else {

  allRequestData = [];

  renderRequestTable(
    allRequestData
  );

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

function parseRequestTime(value) {
  if (value instanceof Date) {
    return value.getTime();
  }

  const text =
    String(value || "").trim();

  const match =
    text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/
    );

  if (!match) {
    return 0;
  }

  const day =
    Number(match[1]);

  const month =
    Number(match[2]) - 1;

  const year =
    Number(match[3]);

  const hour =
    Number(match[4]);

  const minute =
    Number(match[5]);

  const second =
    Number(match[6] || 0);

  return new Date(
    year,
    month,
    day,
    hour,
    minute,
    second
  ).getTime();
}

function formatRequestTime(value) {
  const text =
    String(value || "").trim();

  const match =
    text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/
    );

  if (!match) {
    return text || "-";
  }

  return `${match[1]}/${match[2]}/${match[3]}<br>${match[4]}:${match[5]}`;
}

let popupScrollY = 0;

function lockBodyScroll() {

  popupScrollY =
    window.scrollY ||
    document.documentElement.scrollTop;

  document.body.style.top =
    `-${popupScrollY}px`;

  document.body.style.position =
    "fixed";

  document.body.style.width =
    "100%";

  document.body.style.overflow =
    "hidden";

  document.body.classList.add(
    "modal-open"
  );

  document.documentElement.classList.add(
    "modal-open"
  );
}

function unlockBodyScroll() {

  document.body.style.position =
    "";

  document.body.style.top =
    "";

  document.body.style.width =
    "";

  document.body.style.overflow =
    "";

  document.body.classList.remove(
    "modal-open"
  );

  document.documentElement.classList.remove(
    "modal-open"
  );

  window.scrollTo(
    0,
    popupScrollY
  );
}

function showRequestMovePopup(item) {

  const old =
    document.getElementById("requestMoveModal");

  if (old) old.remove();

  const modal =
    document.createElement("div");

  modal.id = "requestMoveModal";
  modal.className = "edit-song-modal";

  const waktu =
    item["Waktu"] || "-";

  const namaLagu =
    item["Nama Lagu"] || "";

  const pesan =
    item["Catatan"] || "-";

  const peminta =
    item["Peminta"] || "-";

  modal.innerHTML = `

    <div class="edit-song-overlay"></div>
    <div class="edit-song-box">

      <div class="edit-song-scroll">

        <h3>Detail Request</h3>

        <div class="request-detail-list song-detail-list">

          <div class="song-detail-two">
            <div>
              <span>Waktu</span>
              <strong>${waktu}</strong>
            </div>

            <div>
              <span>Peminta</span>
              <strong>${peminta}</strong>
            </div>
          </div>

          <div>
            <span>Nama Lagu</span>
            <strong>${namaLagu}</strong>
          </div>

          <div>
            <span>Pesan</span>
            <strong>${pesan}</strong>
          </div>

        </div>

        <div class="song-detail-actions">
          <button type="button" class="edit-song-cancel" id="requestMoveCancel">
            Batal
          </button>

          <button type="button" class="song-delete-btn" id="requestMoveDelete">
            Hapus
          </button>

          <button type="button" class="edit-song-save" id="requestMoveNext">
            Pindah
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  lockBodyScroll();

  document
    .getElementById("requestMoveCancel")
    .onclick = () => {
      modal.remove();
      unlockBodyScroll();
    };

  document.getElementById("requestMoveDelete").onclick = async () => {
    await appAlert(
      "Fitur hapus request belum tersedia.",
      "warning"
    );
  };

  document
    .getElementById("requestMoveNext")
    .onclick = () => {

      modal.remove();

      showMoveToSongForm({
        waktu,
        namaLagu,
        pesan,
        peminta,
        link: getRequestLink(item)
      });
    };
}

function showRequestDetailPopup(item) {
  const old =
    document.getElementById("requestDetailModal");

  if (old) old.remove();

  const modal =
    document.createElement("div");

  modal.id = "requestDetailModal";
  modal.className = "edit-song-modal";

  const role = getActiveRole();

  const waktu =
    item["Waktu"] || "-";

  const namaLagu =
    item["Nama Lagu"] || "-";

  const pesan =
    item["Catatan"] || "-";

  const peminta =
    item["Peminta"] || "-";

  const actionText =
    role === "vocal"
      ? "Lihat Lirik"
      : "Lihat Chord";

  modal.innerHTML = `
    <div class="edit-song-overlay"></div>

    <div class="edit-song-box">
      <div class="edit-song-scroll">

        <h3>Detail Request</h3>

        <div class="request-detail-list song-detail-list">

          <div class="song-detail-two">
            <div>
              <span>Waktu</span>
              <strong>${waktu}</strong>
            </div>

            <div>
              <span>Peminta</span>
              <strong>${peminta}</strong>
            </div>
          </div>

          <div>
            <span>Nama Lagu</span>
            <strong>${namaLagu}</strong>
          </div>

          <div>
            <span>Pesan</span>
            <strong>${pesan}</strong>
          </div>

        </div>

        <div class="song-detail-actions two">
          <button
            type="button"
            class="edit-song-cancel"
            id="requestDetailClose"
          >
            Tutup
          </button>

          <button
            type="button"
            class="edit-song-save"
            id="requestDetailOpen"
          >
            ${actionText}
          </button>

          <button
            type="button"
            class="edit-song-save"
            id="requestDetailComment"
          >
            Komentar
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
  lockBodyScroll();

  document.getElementById("requestDetailClose").onclick = () => {
    modal.remove();
    unlockBodyScroll();
  };

  document.getElementById("requestDetailOpen").onclick = () => {
    const finalLink =
    normalizeSongLink(
      getRequestLink(item)
    ) ||
    getDefaultSongLink(namaLagu);

    window.open(finalLink, "_blank");

    modal.remove();
    unlockBodyScroll();
  };
}

function showMoveToSongForm(data) {

  const old =
    document.getElementById("moveToSongModal");

  if (old) old.remove();

  const modal =
    document.createElement("div");

  modal.id = "moveToSongModal";
  modal.className = "edit-song-modal";

  modal.innerHTML = `
    <div class="edit-song-overlay"></div>

    <div class="edit-song-box edit-song-form-box">
      <div class="edit-song-scroll">

        <h3>Pindah ke Daftar Lagu</h3>

        <div class="edit-form-detail-list">

          <div class="edit-form-card">
            <span>Kategori</span>

            <div class="move-category-wrap edit-category-top">
              <button
                type="button"
                id="moveSongCategory"
                class="edit-category-btn"
                data-value=""
              >
                <strong>Pilih kategori</strong>
                <i class="ri-arrow-down-s-line"></i>
              </button>

              <div class="move-category-menu edit-category-menu">
                <button type="button" data-value="Trend 2026">Trend 2026</button>
                <button type="button" data-value="Trend 2025">Trend 2025</button>
                <button type="button" data-value="Trend 2024">Trend 2024</button>
                <button type="button" data-value="Trend 2023 Kebawah">Trend 2023 Kebawah</button>
                <button type="button" data-value="Lawasan V1">Lawasan V1</button>
                <button type="button" data-value="Lawasan V2">Lawasan V2</button>
                <button type="button" data-value="Campursari">Campursari</button>
                <button type="button" data-value="Religi">Religi</button>
              </div>
            </div>
          </div>

          <div class="edit-form-card">
            <span>Nama Lagu</span>
            <input
              id="moveSongName"
              class="edit-detail-input"
              maxlength="30"
              value="${cleanEditSongValue("Nama Lagu", data.namaLagu)}"
            >
          </div>

          <div class="edit-form-three">
            <div class="edit-form-card">
              <span>Pria</span>
              <input id="moveSongNadaPria" class="edit-detail-input" maxlength="12">
            </div>

            <div class="edit-form-card">
              <span>Duet</span>
              <input id="moveSongNadaDuet" class="edit-detail-input" maxlength="12">
            </div>

            <div class="edit-form-card">
              <span>Wanita</span>
              <input id="moveSongNadaWanita" class="edit-detail-input" maxlength="12">
            </div>
          </div>

          <div class="edit-form-card">
            <span>Tempo</span>
            <input
              id="moveSongTempo"
              class="edit-detail-input"
              maxlength="8"
            >
          </div>

          <div class="edit-form-card">
            <span>Catatan</span>
            <textarea
              id="moveSongNote"
              class="edit-detail-textarea"
              maxlength="100"
            >${cleanEditSongValue(
              "Catatan",
              data.pesan === "-" ? "" : data.pesan
            ).trimStart()}</textarea>
          </div>

        </div>

        <div class="edit-form-actions">
          <button
            type="button"
            class="edit-song-cancel"
            id="moveSongCancel"
          >
            Batal
          </button>

          <button
            type="button"
            class="edit-song-save"
            id="moveSongSave"
          >
            Pindahkan
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
  lockBodyScroll();

  const nameInput =
    document.getElementById("moveSongName");

  const categoryInput =
    document.getElementById("moveSongCategory");

  const categoryMenu =
    modal.querySelector(".move-category-menu");

  const categoryText =
    categoryInput.querySelector("strong");

  categoryInput.onclick = (e) => {
    e.stopPropagation();

    const wrap = categoryInput.parentElement;
    const isOpen = wrap.classList.contains("active");

    wrap.classList.toggle("active");

    if (!isOpen) {
      requestAnimationFrame(() => {
        const current = categoryInput.dataset.value;

        if (!current) {
          categoryMenu.scrollTop = 0;
          return;
        }

        const selected = categoryMenu.querySelector(
          `button[data-value="${current}"]`
        );

        if (selected) {
          selected.scrollIntoView({
            block: "center",
            behavior: "instant"
          });
        }
      });
    }
  };

  categoryMenu
    .querySelectorAll("button")
    .forEach(btn => {

      btn.onclick = (e) => {
        e.stopPropagation();

        categoryInput.dataset.value =
          btn.dataset.value;

        categoryText.innerText =
          btn.dataset.value;

        categoryInput
          .parentElement
          .classList
          .remove("active");

        checkMoveChanges();
      };
    });

  const nadaPria =
    document.getElementById(
      "moveSongNadaPria"
    );

  const nadaDuet =
    document.getElementById(
      "moveSongNadaDuet"
    );

  const nadaWanita =
    document.getElementById(
      "moveSongNadaWanita"
    );

  const tempoInput =
    document.getElementById("moveSongTempo");

  const noteInput =
    document.getElementById("moveSongNote");

  const saveBtn =
    document.getElementById("moveSongSave");

  let confirmMove = false;

  function checkMoveChanges() {
    const changed =
      categoryInput.dataset.value.trim() !== "" ||
      nameInput.value.trim() !== cleanEditSongValue("Nama Lagu", data.namaLagu).trim() ||
      nadaPria.value.trim() !== "" ||
      nadaDuet.value.trim() !== "" ||
      nadaWanita.value.trim() !== "" ||
      tempoInput.value.trim() !== "" ||
      noteInput.value.trim() !== cleanEditSongValue(
        "Catatan",
        data.pesan === "-" ? "" : data.pesan
      ).trim();

    saveBtn.disabled = !changed;

    if (!changed || confirmMove) {
      confirmMove = false;
      saveBtn.innerHTML = "Pindahkan";
    }
  }

  saveBtn.disabled = true;

  nameInput.addEventListener("input", () => {
    nameInput.value =
      cleanEditSongValue("Nama Lagu", nameInput.value);

    checkMoveChanges();
  });

  [nadaPria, nadaDuet, nadaWanita].forEach(input => {
    input.addEventListener("input", () => {
      input.value =
        cleanEditSongValue("Nada Pria", input.value);

      checkMoveChanges();
    });
  });

  tempoInput.addEventListener("input", () => {
    tempoInput.value =
      cleanEditSongValue("Tempo", tempoInput.value);

    checkMoveChanges();
  });

  noteInput.addEventListener("input", () => {
    noteInput.value =
      cleanEditSongValue("Catatan", noteInput.value);

    checkMoveChanges();
  });

  document
    .getElementById("moveSongCancel")
    .onclick = () => {
      modal.remove();
      unlockBodyScroll();
    };

  saveBtn.onclick = async () => {

      if (!confirmMove) {
        confirmMove = true;
        saveBtn.innerHTML = "Yakin?";

        setTimeout(() => {
          if (confirmMove) {
            confirmMove = false;
            saveBtn.innerHTML = "Pindahkan";
          }
        }, 3000);

        return;
      }

      confirmMove = false;

      const cancelBtn =
        document.getElementById("moveSongCancel");

      const namaLagu =
        cleanEditSongValue(
          "Nama Lagu",
          nameInput.value
        ).trim();

      const kategori =
        categoryInput.dataset.value;

      if (!namaLagu) {

        await appAlert(
          "Nama lagu wajib diisi",
          "warning"
        );

        return;
      }

      if (!kategori) {

        await appAlert(
          "Pilih kategori dulu",
          "warning"
        );

        return;
      }

      saveBtn.disabled = true;
      cancelBtn.disabled = true;

      modal.classList.add(
        "form-loading"
      );

      saveBtn.innerHTML = `
        <i class="ri-loader-4-line rotating"></i>
        Memindahkan...
      `;

      try {

        const response =
          await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({
              action: "moveRequestToSong",
              token: sessionStorage.getItem("aqila_token"),

              requestNamaLagu: data.namaLagu,
              requestWaktu: data.waktu,

              kategori:
              kategori,

              namaLagu,
              nadaPria: nadaPria.value.trim(),
              nadaDuet: nadaDuet.value.trim(),
              nadaWanita: nadaWanita.value.trim(),
              tempo: tempoInput.value.trim(),
              catatan: noteInput.value.trim(),
              link: data.link || ""
            })
          });

        const result =
          await response.json();

        if (!result.success) {
          await appAlert(
            result.message ||
              "Gagal memindahkan request",
            "error"
          );

          saveBtn.disabled = false;
          cancelBtn.disabled = false;
          modal.classList.remove("form-loading");
          saveBtn.innerHTML = "Simpan";

          return;
        }

        modal.remove();
        unlockBodyScroll();

        await appAlert(
          "Request berhasil dipindahkan ke daftar lagu",
          "success"
        );

      } catch (error) {

        console.error(error);

        await appAlert(
          "Gagal terhubung ke server",
          "error"
        );

        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        modal.classList.remove("form-loading");
        saveBtn.innerHTML = "Simpan";
      }
    };
  }

function renderRequestTable(data) {
  const requestTable =
    document.querySelector(
      "#requestSection .table-responsive"
    );

  const savedScrollLeft = 0;

  if (!data || data.length === 0) {
    requestTable.classList.add("table-empty");

    requestTable.innerHTML = `
      <div class="empty-state">
        Belum ada request
      </div>
    `;

    document
      .getElementById("requestPagination")
      .classList.add("hidden");

    return;
  }

  requestTable.classList.remove("table-empty");

  if (currentRequestKeyword) {
    data = data.filter(item => {
      const lagu = item["Nama Lagu"] || "";
      const catatan = item["Catatan"] || "";
      const peminta = item["Peminta"] || "";

      return (
        lagu.toLowerCase().includes(currentRequestKeyword) ||
        catatan.toLowerCase().includes(currentRequestKeyword) ||
        peminta.toLowerCase().includes(currentRequestKeyword)
      );
    });
  }

  if (data.length === 0) {
    requestTable.classList.add("table-empty");

    requestTable.innerHTML = `
      <div class="empty-state">
        Request tidak ditemukan
      </div>
    `;

    document
      .getElementById("requestPagination")
      .classList.add("hidden");

    return;
  }

  data = [...data];

  data.sort((a, b) => {
    const timeA = parseRequestTime(a["Waktu"]);
    const timeB = parseRequestTime(b["Waktu"]);

    if (requestSortMode === "newest") {
      return timeB - timeA;
    }

    return timeA - timeB;
  });

  const totalRequestPages =
    Math.ceil(data.length / getRequestItemsPerPage());

  currentRequestPage =
    Math.min(
      currentRequestPage,
      totalRequestPages || 1
    );

  const start =
    (currentRequestPage - 1) * getRequestItemsPerPage();

  const end =
    start + getRequestItemsPerPage();

  const paginatedData =
    data.slice(start, end);

  const isDoubleRequest =
    window.innerWidth >= 768;

  const table =
    document.createElement("table");

  if (isDoubleRequest) {

  table.innerHTML = `
  <thead>
  <tr>
  <th>Waktu</th>
  <th>Nama Lagu</th>
  <th>Waktu</th>
  <th>Nama Lagu</th>
  </tr>
  </thead>
  <tbody></tbody>
  `;

  const tbody =
  table.querySelector("tbody");

  const half =
  Math.ceil(
  paginatedData.length / 2
  );

  for (
  let i = 0;
  i < half;
  i++
  ){

  const tr =
  document.createElement("tr");

  const item1 =
  paginatedData[i];

  const item2 =
  paginatedData[i + half];

  [item1,item2]
  .forEach(item=>{

  const tdWaktu =
  document.createElement("td");

  const tdLagu =
  document.createElement("td");

  if(item){

  tdWaktu.innerHTML =
  formatRequestTime(
  item["Waktu"]
  );

  tdLagu.textContent =
  item["Nama Lagu"]||"-";

  tdLagu.classList.add(
  "text-left",
  "song-title-link"
  );

  const openRequestDetail = () => {
  const role = getActiveRole();

    if (role === "playerplus") {
      showRequestMovePopup(item);
      return;
    }

    if (
      role === "player" ||
      role === "vocal"
    ) {
      showRequestDetailPopup(item);
      return;
    }

    showSongLinkModal(
      item["Nama Lagu"],
      getRequestLink(item)
    );
  };

  tdWaktu.onclick = openRequestDetail;
  tdLagu.onclick = openRequestDetail;

  tdWaktu.style.cursor = "pointer";
  tdLagu.style.cursor = "pointer";

  }else{

  tdWaktu.textContent="";
  tdLagu.textContent="";

  }

  tr.appendChild(
  tdWaktu
  );

  tr.appendChild(
  tdLagu
  );

  });

  tbody.appendChild(
  tr
  );

  }

  }else{

  table.innerHTML=`
  <thead>
  <tr>
  <th>Waktu</th>
  <th>Nama Lagu</th>
  </tr>
  </thead>
  <tbody></tbody>
  `;

  const tbody =
  table.querySelector("tbody");

  paginatedData.forEach(
  item=>{

  const tr =
  document.createElement("tr");

  const tdWaktu =
  document.createElement("td");

  tdWaktu.innerHTML=
  formatRequestTime(
  item["Waktu"]
  );

  const tdLagu =
  document.createElement("td");

  tdLagu.textContent=
  item["Nama Lagu"]||"-";

  tdLagu.classList.add(
  "text-left",
  "song-title-link"
  );

  const openRequestDetail = () => {
    const role = getActiveRole();

    if (role === "playerplus") {
      showRequestMovePopup(item);
      return;
    }

    if (
      role === "player" ||
      role === "vocal"
    ) {
      showRequestDetailPopup(item);
      return;
    }

    showSongLinkModal(
      item["Nama Lagu"],
      getRequestLink(item)
    );
  };

  tdWaktu.onclick = openRequestDetail;
  tdLagu.onclick = openRequestDetail;

  tdWaktu.style.cursor = "pointer";
  tdLagu.style.cursor = "pointer";

  tr.appendChild(
  tdWaktu
  );

  tr.appendChild(
  tdLagu
  );

  tbody.appendChild(
  tr
  );

  });

  }

  requestTable.innerHTML = "";
  requestTable.appendChild(table);

  renderRequestPagination(data.length);

  setTimeout(() => {
    requestTable.scrollLeft = savedScrollLeft;
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
      76;

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
      ),
      -25
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
      ),
      -25
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
        ),
        -25
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
  target = null,
  offset = 0
) {

  if (target) {

    const y =
      target.getBoundingClientRect()
        .top +
      window.pageYOffset +
      offset;

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

limitSearchInput(
  googleSearchInput,
  60,
  WEB_SEARCH_ALLOWED_REGEX
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
    }

  );

}

const openSpreadsheetBtn =
  document.getElementById(
    "openSpreadsheetBtn"
  );

function setSpreadsheetButtonLoading(
  isLoading,
  originalText = ""
) {

  if (!openSpreadsheetBtn) return;

  if (isLoading) {

    openSpreadsheetBtn.disabled = true;

    openSpreadsheetBtn.innerHTML = `
      <span class="account-menu-icon">
        <i class="ri-loader-4-line rotating"></i>
      </span>

      <span class="account-menu-text">
        Memuat...
      </span>

      <i class="ri-arrow-right-s-line account-menu-arrow"></i>
    `;

    return;
  }

  openSpreadsheetBtn.disabled = false;

  if (originalText) {
    openSpreadsheetBtn.innerHTML =
      originalText;
  }
}

function getGooglePlaceholders() {

  const role =
    getActiveRole();

  if (
    role === "player" ||
    role === "playerplus"
  ) {

    return [
      "Chordtela Lagu Kerinduan",
      "Chordtela Lagu Gelandangan"
    ];
  }

  return [
    "Lirik Lagu Kerinduan",
    "Lirik Lagu Gelandangan"
  ];
}

const youtubeSearchForm =
  document.getElementById(
    "youtubeSearchForm"
  );

const youtubeSearchInput =
  document.getElementById(
    "youtubeSearchInput"
  );

limitSearchInput(
  youtubeSearchInput,
  60,
  WEB_SEARCH_ALLOWED_REGEX
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
    }

  );

}

const YT_SEARCH_CHOICE_KEY =
  "aqila_yt_search_choice";

function getYoutubeSearchUrl(keyword) {

  return `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&app=desktop`;
}

function getPokeTubeSearchUrl(keyword) {

  const q =
    encodeURIComponent(keyword);

  return window.innerWidth <= 768

    ? `https://poketube.fun/app?mobilesearch=${q}`

    : `https://poketube.fun/search?query=${q}`;
}

function openYoutubeSearchByChoice(choice, keyword) {

  const url =
    choice === "poketube"
      ? getPokeTubeSearchUrl(keyword)
      : getYoutubeSearchUrl(keyword);

  window.open(
    url,
    "_blank"
  );
}

function showYoutubeChoiceModal(keyword) {

  const oldModal =
    document.getElementById(
      "ytChoiceModal"
    );

  if (oldModal) {
    oldModal.remove();
  }

  const modal =
    document.createElement("div");

  modal.id =
    "ytChoiceModal";

  modal.className =
    "yt-choice-modal";

  modal.innerHTML = `
    <div class="yt-choice-overlay"></div>

    <div class="yt-choice-box">

      <button
        type="button"
        class="yt-choice-close"
        id="ytChoiceClose"
      >
        <i class="ri-close-line"></i>
      </button>

      <div class="yt-choice-icon">
        <i class="ri-youtube-fill"></i>
      </div>

      <h3>
        Pilih Pemutar
      </h3>

      <p>
        Mau buka hasil pencarian lewat mana?
      </p>

      <div class="yt-choice-actions">

        <button
          type="button"
          class="yt-choice-btn youtube"
          data-choice="youtube"
        >
          <i class="ri-youtube-fill"></i>
          YouTube
        </button>

        <button
          type="button"
          class="yt-choice-btn poketube"
          data-choice="poketube"
        >
          <i class="ri-play-circle-line"></i>
          PokeTube
        </button>

      </div>

      <label class="yt-choice-remember">

        <input
          type="checkbox"
          id="ytChoiceRemember"
        >

        <span>
          Ingat pilihan saya
        </span>

      </label>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  const remember =
    document.getElementById(
      "ytChoiceRemember"
    );

  modal
    .querySelectorAll(
      ".yt-choice-btn"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          const choice =
            btn.dataset.choice;

          if (remember.checked) {

            localStorage.setItem(
              YT_SEARCH_CHOICE_KEY,
              choice
            );
          }

          openYoutubeSearchByChoice(
            choice,
            keyword
          );

          modal.remove();
        }
      );
    });

  document
    .getElementById(
      "ytChoiceClose"
    )
    .addEventListener(
      "click",
      () => {

        modal.remove();
      }
    );
}

function handleYoutubeSearch(keyword) {

  const savedChoice =
    localStorage.getItem(
      YT_SEARCH_CHOICE_KEY
    );

  if (
    savedChoice === "youtube" ||
    savedChoice === "poketube"
  ) {

    openYoutubeSearchByChoice(
      savedChoice,
      keyword
    );

    return;
  }

  showYoutubeChoiceModal(
    keyword
  );
}

if (youtubeSearchForm) {

  youtubeSearchForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const keyword =
        youtubeSearchInput.value.trim();

      if (!keyword) {

        await appAlert(
          "Masukkan kata pencarian",
          "warning"
        );

        return;
      }

      handleYoutubeSearch(
        keyword
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

  const googlePlaceholders =
    getGooglePlaceholders();

  const text =
    googlePlaceholders[
      googlePlaceholderIndex %
      googlePlaceholders.length
    ];

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
    async (e) => {

      e.preventDefault();

      const keyword =
        googleSearchInput.value.trim();

      if (!keyword) {
        await appAlert(
          "Masukkan kata pencarian",
          "warning"
        );
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

      setSpreadsheetButtonLoading(
        true,
        originalText
      );

      try {

        const response =
          await fetch(
            SCRIPT_URL,
            {
              method: "POST",

              body: JSON.stringify({
                action: "config",
                token: sessionStorage.getItem("aqila_token")
              })
            }
          );

        const data =
          await response.json();

        if (
          !data.spreadsheetUrl
        ) {

          await appAlert(
            "Link spreadsheet belum tersedia",
            "warning"
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

        await appAlert(
          "Gagal membuka spreadsheet",
          "error"
        );

      } finally {

        setSpreadsheetButtonLoading(
          false,
          originalText
        );
      }
    }
  );
}

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      const confirmLogout =
        await appConfirm(
          "Yakin ingin keluar?",
          "Keluar Akun",
          "Keluar",
          "Batal"
        );

      if (!confirmLogout)
        return;

      localStorage.removeItem(
        "aqila_role"
      );

      if (
        localStorage.getItem("aqila_remember") !== "true"
      ) {
        localStorage.removeItem(
          "aqila_name"
        );
      }

      localStorage.removeItem(
        "aqila_last_active"
      );

      localStorage.removeItem(
        "aqila_login_time"
      );

      localStorage.removeItem(
        "aqila_yt_search_choice"
      );

      localStorage.removeItem(
        "aqila_tab"
      );

      sessionStorage.removeItem("aqila_token");

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
  async () => {

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
            "Umum"

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

    const loginTime =
      localStorage.getItem(
        "aqila_login_time"
      );

      if (role && !loginTime) {
        localStorage.setItem(
          "aqila_login_time",
          Date.now()
        );
      }

    if (
      role &&
      loginTime &&
      Date.now() - Number(loginTime) >= MAX_SESSION_DURATION
    ) {
      localStorage.removeItem("aqila_role");
      localStorage.removeItem("aqila_last_active");
      localStorage.removeItem("aqila_login_time");
      localStorage.removeItem("aqila_yt_search_choice");
      localStorage.removeItem("aqila_tab");
      sessionStorage.removeItem("aqila_token");

      await appAlert(
        "Anda aktif terlalu lama, silakan login kembali.",
        "warning"
      );

      location.reload();
      return;
    }

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

        localStorage.removeItem(
          "aqila_login_time"
        );

        localStorage.removeItem(
          "aqila_yt_search_choice"
        );

        localStorage.removeItem(
          "aqila_tab"
        );

        await appAlert(
          "Sesi login telah berakhir",
          "warning"
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

const TITLE_ALLOWED_REGEX =
  /[^A-Za-z0-9\s\-()+±#\/.,'&]/g;

const NOTE_ALLOWED_REGEX =
  /[^A-Za-z0-9\s\-()+±#\/.,'&?!]/g;

function cleanTitleText(text) {

  return String(text || "")
    .replace(TITLE_ALLOWED_REGEX, "")
    .replace(/^\s+/, "")
    .replace(/\s{2,}/g, " ");
}

function cleanNoteText(text) {

  return String(text || "")
    .replace(NOTE_ALLOWED_REGEX, "")
    .replace(/^\s+/, "")
    .replace(/\s{2,}/g, " ");
}

function isValidTitle(text) {

  return (
    cleanTitleText(text) === text &&
    /[A-Za-z0-9]/.test(text)
  );
}

function isValidNote(text) {

  return cleanNoteText(text) === text;
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

      await appAlert(
        "Nama lagu wajib diisi",
        "warning"
      );

      return;
    }

if (!isValidTitle(namaLagu)) {

  await appAlert(
    "Nama lagu berisi karakter yang tidak didukung",
    "warning"
  );

  return;
}

    if (namaLagu.length > 30) {

      await appAlert(
        "Nama lagu maksimal 30 karakter",
        "warning"
      );

      return;
    }

if (
  catatan &&
  !isValidNote(catatan)
) {

  await appAlert(
    "Pesan berisi karakter yang tidak didukung",
    "warning"
  );

  return;
}

    if (catatan.length > 100) {

      await appAlert(
        "Pesan maksimal 100 karakter",
        "warning"
      );

      return;
    }

    const confirmRequest =
      await appConfirm(
        "Kirim request lagu ini?",
        "Konfirmasi Request",
        "Kirim",
        "Batal"
      );

    if (!confirmRequest) return;

    const role =
      localStorage.getItem(
        "aqila_role"
      );

    const roleLabel = {
      player: "Player",
      playerplus: "Player",
      vocal: "Vocal",
      lainnya: "Umum"
    };

    try {
      const loadingStart =
        Date.now();

      isSendingRequest = true;

      requestForm.classList.add("form-loading");

      namaLaguInput.disabled = true;
      catatanInput.disabled = true;

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
              token: sessionStorage.getItem("aqila_token"),

              namaLagu,
              catatan,

              requestBy:
              `${localStorage.getItem("aqila_name")} (${roleLabel[role]})`
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

        localStorage.removeItem(
          "aqila_last_request"
        );

        await appAlert(
          result.message,
          "warning"
        );

        return;
      }
      localStorage.setItem(
        "aqila_last_request",
        Date.now()
      );

      await appAlert(
        `Request berhasil dikirim 🔥 <br>
        <span class="popup-small-note">
          Terima kasih sudah mengirim request. Lagu akan dipertimbangkan terlebih dahulu. Jika belum digarap, kemungkinan karena lagunya masih sulit dimainkan, belum familiar, belum sempat diproses, atau kurang populer dan jarang diminati.
        </span>`,
        "success"
      );

      isSendingRequest = false;
      
      updateRequestCooldown();

      requestForm.reset();

      namaCounter.textContent =
        "0/30";

      catatanCounter.textContent =
        "0/100";

    } catch (error) {

      console.error(error);

      await appAlert(
        "Gagal mengirim request",
        "error"
      );

    } finally {

      isSendingRequest = false;

      requestForm.classList.remove("form-loading");

      namaLaguInput.disabled = false;
      catatanInput.disabled = false;

      updateRequestCooldown();

      if (!requestBtn.disabled) {
        requestBtn.innerText =
          "Kirim Request";
      }
    }
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
  async () => {

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

    namaLaguInput.value =
      cleanTitleText(namaLaguInput.value)
        .slice(0, 30);

    namaCounter.textContent =
      `${namaLaguInput.value.length}/30`;
  }
);

catatanInput.addEventListener(
  "input",
  () => {

    catatanInput.value =
      cleanNoteText(catatanInput.value)
        .slice(0, 100);

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

let notifScrollY = 0;

notifBtn.addEventListener(
  "click",
  async () => {

    if (!notificationImages.length) {

      await appAlert(
        "Notifikasi belum tersedia",
        "info"
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

    notifScrollY =
      window.scrollY ||
      document.documentElement.scrollTop;

    document.body.style.top =
      `-${notifScrollY}px`;

    document.body.style.position =
      "fixed";

    document.body.style.width =
      "100%";

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

    document.body.style.position =
      "";

    document.body.style.top =
      "";

    document.body.style.width =
      "";

    window.scrollTo(
      0,
      notifScrollY
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

}, 2000);

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

  const role =
    localStorage.getItem(
      "aqila_role"
    );

  if (!role) return;

  const loginTime =
    Number(
      localStorage.getItem(
        "aqila_login_time"
      ) || Date.now()
    );

  if (
    Date.now() - loginTime >=
    MAX_SESSION_DURATION
  ) {
    appAlert(
      "Anda aktif terlalu lama, silakan login kembali",
      "warning"
    ).then(() => {

      localStorage.removeItem("aqila_role");
      localStorage.removeItem("aqila_last_active");
      localStorage.removeItem("aqila_login_time");
      localStorage.removeItem("aqila_yt_search_choice");
      localStorage.removeItem("aqila_tab");

      sessionStorage.removeItem("aqila_token");

      location.reload();
    });

    return;
  }

  localStorage.setItem(
    "aqila_last_active",
    Date.now()
  );

  clearTimeout(sessionTimer);

  const remainingMax =
    MAX_SESSION_DURATION -
    (Date.now() - loginTime);

  sessionTimer =
    setTimeout(async () => {

      await appAlert(
        "Sesi berakhir, silakan login kembali",
        "warning"
      );

      localStorage.removeItem("aqila_role");
      localStorage.removeItem("aqila_last_active");
      localStorage.removeItem("aqila_login_time");
      localStorage.removeItem("aqila_yt_search_choice");
      localStorage.removeItem("aqila_tab");

      sessionStorage.removeItem("aqila_token");

      location.reload();

    }, Math.min(SESSION_TIMEOUT, remainingMax));
}

function initSessionListener() {

  if (sessionListenerInit)
    return;

  sessionListenerInit =
    true;

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

let resizeTimer = null;

window.addEventListener(
  "resize",
  () => {

    clearTimeout(resizeTimer);

    resizeTimer =
      setTimeout(() => {

        if (
          requestLoaded &&
          allRequestData.length > 0
        ) {
          renderRequestTable(
            allRequestData
          );
        }

        if (
          songLoaded &&
          allSongData.length > 0
        ) {
          applySongFilter();
        }

      }, 300);
  }
);

const versionBtn =
  document.getElementById(
    "versionBtn"
  );

if (versionBtn) {

  versionBtn.addEventListener(
    "click",
    async () => {

      await appAlert(
        `
          <span class="about-version-pill">
            Versi ${APP_VERSION}
          </span>

          <span class="about-desc-text">
            Dibuat untuk memudahkan akses lagu dan request musik.
          </span>
        `,
        "info",
        "AQILA MUSIC"
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
      async () => {

        await appAlert(
          "Fitur ubah password belum tersedia.",
          "info",
          "Ubah Password"
        );

      }
    );
}

function getPrintFileName() {

  const now =
    new Date();

  const pad = (num) =>
    String(num).padStart(2, "0");

  const date =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const time =
    `${pad(now.getHours())}.${pad(now.getMinutes())}`;

  return `AQiLa Music - Daftar Lagu - ${date} ${time}`;
}

function setSongSearchForPrint(value = "") {

  currentSongKeyword =
    String(value || "")
      .toLowerCase()
      .trim();

  if (songSearch) {

    songSearch.value =
      value || "";
  }

  currentSongPage = {};
}

function setSongCategoryForPrint(value = "all") {

  currentSongCategory =
    value || "all";

  currentSongPage = {};

  if (!songCategoryFilter) return;

  const options =
    songCategoryFilter.querySelectorAll(
      ".filter-option"
    );

  let selectedText =
    "Semua";

  options.forEach(option => {

    const isActive =
      option.dataset.value ===
      currentSongCategory;

    option.classList.toggle(
      "active",
      isActive
    );

    if (isActive) {

      selectedText =
        option.textContent.trim();
    }
  });

  if (songCategoryText) {

    songCategoryText.textContent =
      selectedText;
  }

  songCategoryFilter.classList.remove(
    "active"
  );
}

function setPrintButtonLoading(
  isLoading,
  originalText = ""
) {

  if (!printSongBtn) return;

  if (isLoading) {

    printSongBtn.disabled = true;

    printSongBtn.innerHTML = `
      <span class="account-menu-icon">
        <i class="ri-loader-4-line rotating"></i>
      </span>

      <span class="account-menu-text">
        Memuat...
      </span>

      <i class="ri-arrow-right-s-line account-menu-arrow"></i>
    `;

    return;
  }

  printSongBtn.disabled = false;

  if (originalText) {
    printSongBtn.innerHTML =
      originalText;
  }
}

const printSongBtn =
  document.getElementById(
    "printSongBtn"
  );

if (printSongBtn) {

  printSongBtn.addEventListener(
    "click",
    async () => {

      if (
        !allSongData ||
        allSongData.length === 0
      ) {

        await appAlert(
          "Daftar lagu belum dimuat",
          "warning"
        );

        return;
      }

      const originalPrintBtnText =
        printSongBtn.innerHTML;

      setPrintButtonLoading(
        true,
        originalPrintBtnText
      );

      const savedSongPage =
        { ...currentSongPage };

      const savedSongKeyword =
        currentSongKeyword;

      const savedSongSearchValue =
        songSearch ? songSearch.value : "";

      const savedSongCategory =
        currentSongCategory;

      const savedScrollY =
        window.scrollY;

      const oldTitle =
        document.title;

      document.title =
        getPrintFileName();

      const isMobilePrint =
        window.innerWidth <= 768;

      isPrintMode = true;

      document.body.classList.add(
        "print-mode"
      );

      setSongSearchForPrint("");
      setSongCategoryForPrint("all");

      applySongFilter();

      let printRestored = false;

      const restorePrintMode = () => {

        if (printRestored) return;

        printRestored = true;

        isPrintMode = false;

        document.body.classList.remove(
          "print-mode"
        );

        currentSongPage =
          savedSongPage;

        setSongSearchForPrint(
          savedSongSearchValue
        );

        currentSongKeyword =
          savedSongKeyword;

        setSongCategoryForPrint(
          savedSongCategory
        );

        currentSongPage =
          savedSongPage;

        applySongFilter();

        window.scrollTo(
          0,
          savedScrollY
        );

        document.title =
          oldTitle;

        setPrintButtonLoading(
          false,
          originalPrintBtnText
        );
      };

      if (!isMobilePrint) {

        window.addEventListener(
          "afterprint",
          restorePrintMode,
          { once: true }
        );
      }

      setTimeout(() => {

        window.print();

        setTimeout(() => {
          restorePrintMode();
        }, 1500);

        if (isMobilePrint) {

          const restoreAfterReturn = () => {

            if (
              document.visibilityState ===
              "visible"
            ) {

              setTimeout(() => {

                restorePrintMode();

              }, 800);

              document.removeEventListener(
                "visibilitychange",
                restoreAfterReturn
              );
            }
          };

          document.addEventListener(
            "visibilitychange",
            restoreAfterReturn
          );

          window.addEventListener(
            "focus",
            () => {

              setTimeout(() => {

                restorePrintMode();

              }, 800);

            },
            { once: true }
          );

          setTimeout(() => {

            document.addEventListener(
              "click",
              restorePrintMode,
              { once: true }
            );

          }, 10000);
        }

      }, isMobilePrint ? 1500 : 150);
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

function showWelcomeSongCard() {

  const welcomeCard =
    document.getElementById(
      "welcomeSongCard"
    );

  const welcomeTitle =
    document.getElementById(
      "welcomeSongTitle"
    );

  if (!welcomeCard) return;

  const userName =
    localStorage.getItem(
      "aqila_name"
    ) || "Pengguna";

  if (welcomeTitle) {
    welcomeTitle.innerText =
      `Halo, ${userName} 👋`;
  }

  welcomeCard.classList.remove(
    "hidden",
    "hide-out"
  );

  setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, 100);

  setTimeout(() => {

    welcomeCard.classList.add(
      "hide-out"
    );

    setTimeout(() => {

      welcomeCard.classList.add(
        "hidden"
      );

      welcomeCard.classList.remove(
        "hide-out"
      );

    }, 600);

  }, 10000);
}
