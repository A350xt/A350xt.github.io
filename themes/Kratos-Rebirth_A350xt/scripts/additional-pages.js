// 生成404页面
hexo.extend.generator.register("page-notfound", (locals) => ({
  path: "404.html",
  data: {
    type: "404",
    title_i18n: "title.not_found",
  },
  layout: "_pages/404",
}));

// 生成 tags 页面
hexo.extend.generator.register("page-tags", (locals) => ({
  path: hexo.route.format(hexo.config.tag_dir + "/"),
  data: {
    title_i18n: "title.tag",
  },
  layout: "_pages/tags",
}));

// 生成 categories 页面
hexo.extend.generator.register("page-categories", (locals) => ({
  path: hexo.route.format(hexo.config.category_dir + "/"),
  data: {
    title_i18n: "title.category",
  },
  layout: "_pages/categories",
}));

// 生成 moments 页面
hexo.extend.generator.register("page-moments", () => {
  const momentsConfig = hexo.theme.config?.moments;
  if (!momentsConfig || !momentsConfig.enable) {
    return undefined;
  }

  const pagePath = momentsConfig.page?.path || "moments/index.html";
  const normalizedPath = hexo.route.format(pagePath);

  return {
    path: normalizedPath,
    data: {
      type: "moments",
      title: momentsConfig.page?.title,
      subtitle: momentsConfig.page?.subtitle,
      description: momentsConfig.page?.description,
      cover: momentsConfig.page?.cover,
      title_i18n: "title.moments",
      moments_config: momentsConfig,
      comments: false,
    },
    layout: "_pages/moments",
  };
});
