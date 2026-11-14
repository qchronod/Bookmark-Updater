function showDateUpdate(dateUpdate, publicationDate, publicationDateError, statusDiv) {
    const actionDiv = document.getElementById("date-action");
    actionDiv.replaceChildren();

    const dateStatus = document.createElement("p");
    dateStatus.textContent = publicationDate
        ? `Page publication date detected: ${publicationDate}.`
        : publicationDateError
            ? `Could not read the page publication date: ${publicationDateError}`
            : "No page publication date was detected.";
    actionDiv.appendChild(dateStatus);

    if (!dateUpdate) {
        if (publicationDate) {
            const noUpdate = document.createElement("p");
            noUpdate.textContent = "No date update was generated for this bookmark title.";
            actionDiv.appendChild(noUpdate);
        }
        return;
    }

    const button = document.createElement("button");
    button.textContent = `Update bookmark date to ${dateUpdate.displayDate}`;
    button.addEventListener("click", async () => {
        button.disabled = true;
        try {
            const response = await browser.runtime.sendMessage({
                action: "updateBookmarkDate",
                ids: dateUpdate.ids,
                date: dateUpdate.date
            });
            if (response.status === "success") {
                statusDiv.textContent = "Bookmark date updated.";
                actionDiv.replaceChildren();
            } else if (response.status === "unchanged") {
                statusDiv.textContent = "Bookmark date is already current.";
                actionDiv.replaceChildren();
            } else {
                statusDiv.textContent = response.message || "Unable to update bookmark date.";
                button.disabled = false;
            }
        } catch (error) {
            statusDiv.textContent = error instanceof Error ? error.message : String(error);
            button.disabled = false;
        }
    });
    actionDiv.appendChild(button);
}

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
            statusDiv.textContent = response.alreadyCurrent
                ? `Bookmark is already up to date: "${response.bookmark.title}".`
                : `Successfully updated: "${response.bookmark.title}"!`;
            showDateUpdate(response.dateUpdate, response.publicationDate, response.publicationDateError, statusDiv);
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
                            ids: match.ids,
                            url: response.currentUrl,
                            publicationDate: response.publicationDate,
                            publicationDateError: response.publicationDateError
                        });
                        if (result.status === "success") {
                            statusDiv.textContent = "Bookmark updated successfully!";
                            choicesDiv.replaceChildren();
                            showDateUpdate(result.dateUpdate, result.publicationDate, result.publicationDateError, statusDiv);
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
