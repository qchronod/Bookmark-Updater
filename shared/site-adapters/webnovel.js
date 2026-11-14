(function () {
    function matches(url) {
        return url.hostname === "webnovel.com" || url.hostname.endsWith(".webnovel.com");
    }

    function getStoryKey(url) {
        const bookId = url.pathname.match(/^\/book\/(\d+)(?:\/|$)/)?.[1];
        if (!bookId) return null;
        return `webnovel.com/book/${bookId}`;
    }

    function extractPublicationDate() {
        function toIsoDate(value) {
            const isoDate = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return isoDate ? `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}` : null;
        }

        function collectEntities(value, entities = []) {
            if (Array.isArray(value)) {
                value.forEach(item => collectEntities(item, entities));
            } else if (value && typeof value === "object") {
                entities.push(value);
                if (value["@graph"]) collectEntities(value["@graph"], entities);
            }
            return entities;
        }

        const pagePath = location.pathname;
        const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const article = collectEntities(data).find(item => {
                    const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
                    const pageUrl = typeof item.mainEntityOfPage === "string"
                        ? item.mainEntityOfPage
                        : item.mainEntityOfPage?.["@id"];
                    return types.includes("NewsArticle") &&
                        pageUrl &&
                        new URL(pageUrl, location.href).pathname === pagePath;
                });
                if (article?.datePublished) return toIsoDate(article.datePublished);
            } catch (error) {
                console.error("Could not parse WebNovel chapter metadata:", error);
            }
        }
        return null;
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        getStoryKey,
        extractPublicationDate
    });
})();
