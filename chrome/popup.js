document.addEventListener("DOMContentLoaded", () => {
    const statusDiv = document.getElementById("status");
    const choicesDiv = document.getElementById("choices");

    chrome.runtime.sendMessage({ action: "findAndMatchBookmarks" }, (response) => {
        if (!response) {
            statusDiv.textContent = "Error communicating with extension.";
            return;
        }

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
                item.innerHTML = `
                    <div class="b-title">${match.title}</div>
                    <div class="b-url">${match.url}</div>
                `;
                item.addEventListener("click", () => {
                    chrome.runtime.sendMessage({
                        action: "updateSpecificBookmark",
                        id: match.id,
                        url: response.currentUrl,
                        title: response.currentTitle
                    }, (res) => {
                        if (res && res.status === "success") {
                            statusDiv.textContent = "Bookmark updated successfully!";
                            choicesDiv.innerHTML = "";
                        }
                    });
                });
                choicesDiv.appendChild(item);
            });
        }
    });
});