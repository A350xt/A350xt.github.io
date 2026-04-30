const fs = require("fs");
const path = require("path");
const matter = require("hexo-front-matter");

const SUPPORTED_EXTS = [".md", ".markdown", ".yml", ".yaml", ".json"];
let cachedEntries = [];

const walkDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const result = [];
  for (const entry of fs.readdirSync(dirPath)) {
    if (entry.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      result.push(...walkDir(fullPath));
    } else {
      result.push(fullPath);
    }
  }

  return result;
};

const normalizeArray = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

const normalizeLinks = (links) =>
  normalizeArray(links)
    .filter(Boolean)
    .map((link) => {
      if (typeof link === "string") {
        return { url: link, label: link };
      }
      if (!link.url) {
        return null;
      }
      return {
        url: link.url,
        label: link.label || link.url,
      };
    })
    .filter(Boolean);

const getTimestamp = (configDate, stat) => {
  if (configDate) {
    const date = new Date(configDate);
    if (!Number.isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  if (stat && typeof stat.birthtimeMs === "number" && stat.birthtimeMs > 0) {
    return stat.birthtimeMs;
  }

  if (stat && typeof stat.ctimeMs === "number") {
    return stat.ctimeMs;
  }

  if (stat && typeof stat.mtimeMs === "number") {
    return stat.mtimeMs;
  }

  return Date.now();
};

const slugifyId = (relativePath, explicitId) => {
  if (explicitId) {
    return explicitId;
  }
  return relativePath
    .replace(path.extname(relativePath), "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
};

const parseFile = (absolutePath) => {
  const raw = fs.readFileSync(absolutePath, "utf8");
  const ext = path.extname(absolutePath).toLowerCase();

  if (ext === ".json") {
    const content = JSON.parse(raw);
    return {
      data: content,
      body: content.text || "",
    };
  }

  const parsed = matter.parse(raw) || {};
  const { _content, content, ...data } = parsed;
  return {
    data,
    body: (content || _content || "").trim(),
  };
};

const loadMomentsFromFolder = (hexoInstance, options = {}) => {
  const themeConfig = options.themeConfig || {};
  const storageConfig = themeConfig.storage || {};
  const folderName = storageConfig.folder || "_moments";
  const folderPath = path.resolve(hexoInstance.source_dir, folderName);
  hexoInstance.log.warn(`[moments] resolved folder path: ${folderPath}`);

  if (!fs.existsSync(folderPath)) {
    hexoInstance.log.warn(`[moments] folder "${folderPath}" does not exist.`);
    return [];
  }

  const extensions = (storageConfig.extensions || SUPPORTED_EXTS).map((ext) =>
    ext.toLowerCase(),
  );
  hexoInstance.log.warn(
    `[moments] allowed extensions: ${extensions.join(", ")}`,
  );

  const allFiles = walkDir(folderPath);
  hexoInstance.log.warn(
    `[moments] total files scanned under folder: ${allFiles.length}`,
  );
  allFiles.forEach((filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    hexoInstance.log.warn(
      `[moments] file detected -> ${filePath} (ext: "${ext}")`,
    );
  });
  const files = allFiles.filter((filePath) =>
    extensions.includes(path.extname(filePath).toLowerCase()),
  );

  if (!files.length) {
    hexoInstance.log.warn(
      `[moments] No matching files in ${folderPath}. Total scanned: ${allFiles.length}.`,
    );
    return [];
  }

  const entries = [];

  files.forEach((filePath) => {
    try {
      const stat = fs.lstatSync(filePath);
      const isRegularFile = stat.isFile();
      const isSymlink =
        typeof stat.isSymbolicLink === "function" && stat.isSymbolicLink();
      if (!isRegularFile && !isSymlink) {
        return;
      }

      const { data, body } = parseFile(filePath);
      const relativePath = path.relative(folderPath, filePath);
      const timestamp = getTimestamp(data.date, stat);
      const text = data.text || body;
      if (!text) {
        return;
      }

      entries.push({
        id: slugifyId(relativePath, data.id),
        date: data.date || new Date(timestamp).toISOString(),
        author: data.author || themeConfig.default_author || options.siteAuthor,
        text,
        pinned: Boolean(data.pinned),
        tags: normalizeArray(data.tags),
        images: normalizeArray(data.images),
        links: normalizeLinks(data.links),
        timestamp,
      });
    } catch (error) {
      hexoInstance.log.error(
        `[moments] Failed to parse ${filePath}: ${error.stack || error.message}`,
      );
    }
  });

  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries.map(({ timestamp, ...rest }) => rest);
};

const getFallbackData = (hexoInstance, key) => {
  try {
    const dataFn = hexoInstance.locals.get("data");
    const data = typeof dataFn === "function" ? dataFn() : dataFn;
    return (data && data[key]) || [];
  } catch (error) {
    hexoInstance.log.debug(
      `[moments] Unable to read fallback data (${key}): ${error.message}`,
    );
    return [];
  }
};

const refreshCache = (hexoInstance) => {
  const rawThemeConfig =
    (hexoInstance.theme && hexoInstance.theme.config) || {};
  const themeConfig = rawThemeConfig.moments || {};
  const fallbackKey = themeConfig.data_source || "moments";
  const folderEntries = loadMomentsFromFolder(hexoInstance, {
    themeConfig,
    siteAuthor: hexoInstance.config.author,
  });

  if (folderEntries.length) {
    cachedEntries = folderEntries;
    hexoInstance.log.info(
      `[moments] Loaded ${folderEntries.length} entries from ${(themeConfig.storage && themeConfig.storage.folder) || "_moments"}`,
    );
    return;
  }

  const fallbackEntries = getFallbackData(hexoInstance, fallbackKey);
  cachedEntries = Array.isArray(fallbackEntries) ? [...fallbackEntries] : [];

  if (cachedEntries.length) {
    hexoInstance.log.info(
      `[moments] Fallback to data source "${fallbackKey}" with ${cachedEntries.length} entries`,
    );
  } else {
    hexoInstance.log.warn(
      "[moments] No entries found in _moments folder or data source",
    );
  }
};

hexo.locals.set("krMomentsEntries", () => cachedEntries);

hexo.extend.filter.register("before_generate", function () {
  refreshCache(this);
});

hexo.extend.helper.register("kr_moments_entries", () => cachedEntries);
