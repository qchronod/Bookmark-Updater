document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status");
    const choicesDiv = document.getElementById("choices");

    try {
        const response = await browser.runtime.sendMessage({
            action: "findAndMatchBookmarks"
        });

        if (response.status === "error") {
            statusDiv.textContent = response.message;
        } else if (response.status === "not_found") {
            statusDiv.textContent = `No existing bookmark found for "${response.storyName}".`;
        } else if (response.status === "updated") {
            statusDiv.textContent = `Successfully updated: "${response.bookmark.title}"!`;
        } else if (response.status === "multiple") {
            statusDiv.textContent = "Multiple matching bookmarks found. Please select which one to update:";

            response.matches.forEach(match => {
                const item = document.createElement("div");
                item.className = "bookmark-item";

                const title = document.createElement("div");
                title.className = "b-title";
                title.textContent = match.title;

                const url = document.createElement("div");
                url.className = "b-url";
                url.textContent = match.url;

                item.append(title, url);
                item.addEventListener("click", async () => {
                    try {
                        const result = await browser.runtime.sendMessage({
                            action: "updateSpecificBookmark",
                            id: match.id,
                            url: response.currentUrl
                        });
                        if (result.status === "success") {
                            statusDiv.textContent = "Bookmark updated successfully!";
                            choicesDiv.replaceChildren();
                        } else {
                            statusDiv.textContent = result.message || "Unable to update bookmark.";
                        }
                    } catch (error) {
                        statusDiv.textContent = error instanceof Error ? error.message : String(error);
                    }
                });
                choicesDiv.appendChild(item);
            });
        }
    } catch (error) {
        statusDiv.textContent = error instanceof Error
            ? error.message
            : String(error);
    }
});
