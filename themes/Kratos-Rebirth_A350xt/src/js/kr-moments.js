(() => {
  const COMMENT_VISIBLE_CLASS = "is-visible";
  const DEFAULT_WAIT_TIMEOUT = 15000;

  const getConfig = () => window.kr?.moments || {};

  let walineScriptPromise = null;

  const ensureWalineScript = () => {
    if (window.Waline) {
      return Promise.resolve();
    }

    if (walineScriptPromise) {
      return walineScriptPromise;
    }

    const assets = getConfig().comments?.walineAssets;
    const scriptSrc =
      typeof assets?.js === "string" ? assets.js.trim() : assets?.js;

    if (!scriptSrc) {
      return Promise.reject(
        new Error(
          "Waline 脚本地址缺失，请在 moments.comments.waline.cdn.js 中配置。",
        ),
      );
    }

    walineScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = scriptSrc;
      if (assets?.module) {
        script.type = "module";
      } else {
        script.defer = true;
      }
      script.async = !assets?.module;
      script.onload = () => {
        walineScriptPromise = null;
        resolve();
      };
      script.onerror = () => {
        walineScriptPromise = null;
        reject(new Error("Waline 脚本加载失败，请检查 CDN 地址是否可访问。"));
      };
      document.head.appendChild(script);
    });

    return walineScriptPromise;
  };

  const waitForWaline = async (timeout = DEFAULT_WAIT_TIMEOUT) => {
    if (!window.Waline) {
      await ensureWalineScript();
    }

    return new Promise((resolve, reject) => {
      if (window.Waline) {
        resolve(window.Waline);
        return;
      }

      const start = Date.now();
      const timer = setInterval(() => {
        if (window.Waline) {
          clearInterval(timer);
          resolve(window.Waline);
          return;
        }

        if (Date.now() - start > timeout) {
          clearInterval(timer);
          reject(new Error("Waline 脚本加载超时。"));
        }
      }, 120);
    });
  };

  const buildWalineOptions = (panel, walineConfig = {}) => {
    if (!panel || !walineConfig.serverURL) {
      return null;
    }

    return {
      el: panel,
      path: panel.dataset.commentPath || window.location.pathname,
      serverURL: walineConfig.serverURL,
      lang: walineConfig.lang || "zh-CN",
      emoji: walineConfig.emoji || [],
      login: walineConfig.login ?? "enable",
      reaction: walineConfig.reaction ?? false,
      placeholder: walineConfig.placeholder || "",
      dark: walineConfig.dark,
      meta: walineConfig.meta || ["nick"],
      requiredMeta: walineConfig.requiredMeta || ["nick"],
    };
  };

  const setToggleState = (toggle, panel, isOpen) => {
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));

    if (panel) {
      panel.setAttribute("aria-hidden", String(!isOpen));
    }

    const label = toggle.querySelector("[data-comment-toggle-label]");
    if (label) {
      label.textContent = isOpen
        ? toggle.dataset.commentOpenLabel || "收起评论"
        : toggle.dataset.commentClosedLabel || "评论";
    }
  };

  const ensureCommentShell = (panel) => {
    if (!panel) {
      return null;
    }

    let shell = panel.querySelector(".kr-moment-comment-shell");
    if (shell) {
      return shell;
    }

    panel.innerHTML = "";
    shell = document.createElement("div");
    shell.className = "kr-moment-comment-shell";
    panel.appendChild(shell);
    return shell;
  };

  const hydrateCommentToggles = () => {
    document.querySelectorAll("[data-comment-toggle]").forEach((toggle) => {
      const targetId = toggle.getAttribute("data-comment-toggle");
      if (!targetId) {
        return;
      }

      const panel = document.getElementById(targetId);
      if (!panel) {
        return;
      }

      setToggleState(
        toggle,
        panel,
        panel.classList.contains(COMMENT_VISIBLE_CLASS),
      );
    });
  };

  const mountWaline = async (panel) => {
    if (!panel || panel.dataset.walineMounted === "true") {
      return;
    }

    const { comments } = getConfig();
    const walineOptions = buildWalineOptions(panel, comments?.waline);
    const shell = ensureCommentShell(panel);

    if (!walineOptions) {
      const message = "Waline 配置缺失：请检查 serverURL。";
      if (shell) {
        shell.innerHTML = `<p class="kr-moment-comment-error">${message}</p>`;
      }
      console.error("[moments]", message);
      return;
    }

    try {
      const Waline = await waitForWaline();
      if (!shell) {
        return;
      }

      shell.innerHTML = "";
      const host = document.createElement("div");
      host.className = "kr-moment-waline-host";
      shell.appendChild(host);

      const instance = Waline.init({
        ...walineOptions,
        el: host,
      });

      panel.dataset.walineMounted = "true";
      panel.__walineInstance = instance;
    } catch (err) {
      const message = err?.message || "Waline 初始化失败";
      if (shell) {
        shell.innerHTML = `
				<p class="kr-moment-comment-error">
					${message}
				</p>`;
      }
      console.error("[moments] Waline 初始化失败", err);
      panel.dataset.walineMounted = "false";
    }
  };

  let commentDelegationBound = false;

  const initCommentToggles = () => {
    const { comments } = getConfig();

    if (!comments?.enable || comments.provider !== "waline") {
      return;
    }

    if (commentDelegationBound) {
      return;
    }

    const onToggleClick = async (event) => {
      const toggle = event.target.closest?.("[data-comment-toggle]");
      if (!toggle) {
        return;
      }

      const targetId = toggle.getAttribute("data-comment-toggle");
      if (!targetId) {
        return;
      }

      const panel = document.getElementById(targetId);
      if (!panel) {
        return;
      }

      const isOpen = !panel.classList.contains(COMMENT_VISIBLE_CLASS);
      panel.classList.toggle(COMMENT_VISIBLE_CLASS, isOpen);
      setToggleState(toggle, panel, isOpen);

      if (isOpen) {
        if (panel.dataset.walineMounted === "true") {
          return;
        }

        const shell = ensureCommentShell(panel);
        if (shell) {
          shell.innerHTML =
            '<p class="kr-moment-comment-loading" aria-live="polite">Waline 评论加载中…</p>';
        }
        console.debug(`[moments] mount waline at ${targetId}`);
        await mountWaline(panel);
      }
    };

    document.addEventListener("click", onToggleClick);
    commentDelegationBound = true;
  };

  const init = () => {
    const config = getConfig();
    if (!config.enable) {
      return;
    }
    hydrateCommentToggles();
    initCommentToggles();
  };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:success", init);
  document.addEventListener("pjax:complete", init);
})();
