let allowedDomains = [], checkingDisabled = false;

// Load allowed domains from storage
chrome.extension.sendMessage({type: "getAllowedDomains"}, (res) => {
    allowedDomains = res.allowedDomains || [];
    updateDomains();
});

// Load status from storage
chrome.extension.sendMessage({type: "getStatus"}, (res) => updateStatus(res.disabled))
document.querySelector('#disableChecking').addEventListener('click', () => {
    const resp = confirm("This will disable checking ANY domains until browser restart which MAY PUT YOU AT RISK. Are you sure?");
    if(resp) {
        chrome.extension.sendMessage({type: "setStatus", disabled: true}, (res) => updateStatus(res.disabled))
    }
})

/**
 * Updates status for extension
 * @param {boolean} disabled Whether or not checking is disabled (defaults to already set value)
 */
const updateStatus = (disabled = checkingDisabled) => {
    checkingDisabled = disabled;
    document.querySelector('#disableChecking').disabled = disabled;
    if(disabled) {
        document.querySelector('#disableChecking').innerHTML = "(Restart browser to re-enable checking)";
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(t => {
                const urlObj = new URL(t.url);
                if(urlObj.href.replace(urlObj.search, "") === chrome.runtime.getURL('warning.html')){
                    chrome.tabs.update(t.id, {url: urlObj.searchParams.get('url')})
                }
            })
        } );
    }
}

/**
 * Updates the list of allowed domains in the popup
 */
const updateDomains = () => {
    const list = document.querySelector("#allowedDomains");
    list.innerHTML = "";
    allowedDomains.forEach(domain => {
        let [url, temp] = domain;

        const option = document.createElement("option");
        option.value = url;
        option.innerHTML = `${url}${!temp ? ` (Temporary)` : ""}`
        list.appendChild(option);
    });
}

// Add domain - BUTTON CLICK EVENT
document.querySelector("#addDomain").addEventListener("click", () => {
    const domain = document.querySelector("#domainInput").value;
    if(!domain) return alert("Please enter a domain to add");
    if(!domain.endsWith(".zip")) return alert("Please enter a valid domain (must end with .zip)");

    if(!allowedDomains.includes(domain)) {
        allowedDomains.push([domain, true]);
        chrome.extension.sendMessage({type: "addDomain", domain, rememberChoice: true}, (res) => {
            if(res.success) {
                document.querySelector("#domainInput").value = "";
                document.querySelector("#domainInput").focus();
                updateDomains();
            }
        })
    }
})

// Remove domain - BUTTON CLICK EVENT
document.querySelector("#removeDomain").addEventListener("click", () => {
    const domain = document.querySelector("#allowedDomains").value;
    if(!domain) return alert("Please select a domain to remove");
    console.log(domain, allowedDomains);
    if(allowedDomains.map(r => r[0]).includes(domain)) {
        console.log(domain);
        allowedDomains.splice(allowedDomains.map(r => r[0]).indexOf(domain), 1);
        chrome.extension.sendMessage({type: "removeDomain", domain}, (res) => {
            if(res.success) updateDomains();
        })
    }
})