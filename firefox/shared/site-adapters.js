(function () {
    function matches(url) {
        return url.hostname === "royalroad.com" || url.hostname.endsWith(".royalroad.com");
    }

    function getStoryKey(url) {
        const segments = url.pathname.split("/").filter(Boolean);
        const fictionIndex = segments.indexOf("fiction");
        if (fictionIndex === -1 || segments.length <= fictionIndex + 1) return null;
        return `${url.hostname.replace(/^www\./, "")}/fiction/${segments[fictionIndex + 1]}`;
    }

    function extractPublicationDate() {
        function toIsoDate(value) {
            if (!value) return null;
            const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
            if (/\b(?:ago|just now|today|yesterday)\b/i.test(value)) return null;

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) return null;
            return [
                parsed.getFullYear(),
                String(parsed.getMonth() + 1).padStart(2, "0"),
                String(parsed.getDate()).padStart(2, "0")
            ].join("-");
        }

        const chapterPublication = [...document.querySelectorAll('time[dateonly="true"][datetime]')].find(time => {
            const title = time.getAttribute("title") || "";
            const precedingText = [];
            for (let sibling = time.previousSibling; sibling; sibling = sibling.previousSibling) {
                precedingText.push(sibling.textContent || "");
            }
            return !/\bedited at\b/i.test(`${title} ${precedingText.join(" ")}`);
        });
        if (chapterPublication) {
            const date = toIsoDate(chapterPublication.getAttribute("datetime"));
            if (date) return date;
        }

        const published = [...document.querySelectorAll("time[datetime]")].find(time =>
            time.closest("li")?.querySelector('i[title="Published"]')
        );
        return toIsoDate(published?.getAttribute("datetime"));
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        getStoryKey,
        extractPublicationDate
    });
})();

(function () {
    function matches(url) {
        return url.hostname === "scribblehub.com" || url.hostname.endsWith(".scribblehub.com");
    }

    function getStoryKey(url) {
        const segments = url.pathname.split("/").filter(Boolean);
        const readIndex = segments.indexOf("read");
        const seriesIndex = segments.indexOf("series");
        const storyId = readIndex !== -1 && segments.length > readIndex + 1
            ? segments[readIndex + 1].match(/^\d+/)?.[0]
            : seriesIndex !== -1 && segments.length > seriesIndex + 1
                ? segments[seriesIndex + 1].match(/^\d+/)?.[0]
                : null;
        if (!storyId) return null;
        return `${url.hostname.replace(/^www\./, "")}/story/${storyId}`;
    }

    function extractPublicationDate() {
        function toIsoDate(value) {
            if (!value) return null;
            const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
            if (/\b(?:ago|just now|today|yesterday)\b/i.test(value)) return null;

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) return null;
            return [
                parsed.getFullYear(),
                String(parsed.getMonth() + 1).padStart(2, "0"),
                String(parsed.getDate()).padStart(2, "0")
            ].join("-");
        }

        const chapterId = location.pathname.match(/\/chapter\/(\d+)/)?.[1];
        const seriesUrl = document.querySelector('.chp_byauthor a[href*="/series/"]')?.href;
        if (!chapterId || !seriesUrl) return null;

        return fetch(seriesUrl, { credentials: "include" }).then(async response => {
            if (!response.ok) return null;
            const html = await response.text();
            const seriesDocument = new DOMParser().parseFromString(html, "text/html");
            const chapterLink = [...seriesDocument.querySelectorAll(".toc_w a[href]")].find(link =>
                new URL(link.href).pathname.match(/\/chapter\/(\d+)/)?.[1] === chapterId
            );
            const date = chapterLink?.closest(".toc_w")?.querySelector(".fic_date_pub");
            return toIsoDate(date?.getAttribute("title") || date?.textContent?.trim());
        }).catch(error => {
            console.error("Could not read the Scribble Hub publication date:", error);
            return null;
        });
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        getStoryKey,
        extractPublicationDate
    });
})();

(function () {
    function matches(url) {
        return url.hostname === "wattpad.com" || url.hostname.endsWith(".wattpad.com");
    }

    function getStoryKey(url) {
        const storyId = url.pathname.match(/^\/story\/(\d+)(?:-|\/|$)/)?.[1];
        if (!storyId) return null;
        return `wattpad.com/story/${storyId}`;
    }

    function extractStoryKey() {
        const storyLink = document.querySelector('#funbar-story .toc-header a[href*="/story/"]');
        const storyId = storyLink &&
            new URL(storyLink.href).pathname.match(/^\/story\/(\d+)(?:-|\/|$)/)?.[1];
        return storyId ? `wattpad.com/story/${storyId}` : null;
    }

    function extractPublicationDate() {
        function toIsoDate(value) {
            const isoDate = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return isoDate ? `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}` : null;
        }

        const storyLink = document.querySelector('#funbar-story .toc-header a[href*="/story/"]');
        const storyId = storyLink &&
            new URL(storyLink.href).pathname.match(/^\/story\/(\d+)(?:-|\/|$)/)?.[1];
        const partId = location.pathname.match(/^\/(\d+)(?:-|$)/)?.[1];
        if (!storyId || !partId) return null;

        return fetch(`/api/v3/stories/${storyId}?fields=parts(id,createDate)`, {
            credentials: "include"
        }).then(async response => {
            if (!response.ok) return null;
            const story = await response.json();
            const part = story.parts?.find(item => String(item.id) === partId);
            return toIsoDate(part?.createDate);
        }).catch(error => {
            console.error("Could not read the Wattpad chapter publication date:", error);
            return null;
        });
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        getStoryKey,
        extractStoryKey,
        extractPublicationDate
    });
})();

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

(function () {
    function matches(url) {
        return url.hostname === "spacebattles.com" ||
            url.hostname.endsWith(".spacebattles.com") ||
            url.hostname === "sufficientvelocity.com" ||
            url.hostname.endsWith(".sufficientvelocity.com");
    }

    function extractPublicationDate() {
        function toIsoDate(value) {
            if (!value) return null;
            const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
            if (/\b(?:ago|just now|today|yesterday)\b/i.test(value)) return null;

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) return null;
            return [
                parsed.getFullYear(),
                String(parsed.getMonth() + 1).padStart(2, "0"),
                String(parsed.getDate()).padStart(2, "0")
            ].join("-");
        }

        const postId = location.hash.match(/^#post-(\d+)$/)?.[1];
        const post = postId && document.getElementById(`js-post-${postId}`);
        return toIsoDate(post?.querySelector('time[itemprop="datePublished"][datetime]')?.dateTime);
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        extractPublicationDate
    });
})();

