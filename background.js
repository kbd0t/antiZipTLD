let allowedDomains = [], checkingDisabled = false;

// Load allowed domains from storage
chrome.storage.local.get("allowedDomains", (res) => {
    allowedDomains = res.allowedDomains || [];
});

// Listen for requests and redirect if needed
chrome.webRequest.onBeforeRequest.addListener((details) => {
    if(checkingDisabled) return;

    const urlObj = new URL(details.url);
    if(urlObj.host.endsWith(".zip") && !allowedDomains.map(r => r[0]).includes(urlObj.host)) return {redirectUrl: `${chrome.extension.getURL("warning.html")}?url=${encodeURIComponent(urlObj.href)}`};
}, {urls: ["<all_urls>"]}, ["blocking"]);

// Listen for messages from warning.js
chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.type) { // Browser wants [...]
        case "addDomain": // Add domain to allowed domains, it might be temporary which means it will be removed when the browser is closed
            if(!allowedDomains.map(r => r[0]).includes(request.domain)){
                allowedDomains.push([request.domain, request.rememberChoice]);
                if(request.rememberChoice) chrome.storage.local.get("allowedDomains", (res) => {
                    const a = res.allowedDomains || [];
                    a.push([request.domain, request.rememberChoice]);
                    chrome.storage.local.set({allowedDomains: a});
                });
                return sendResponse({success: true});
            }
            return sendResponse({success: false});

        case "removeDomain": // Remove domain from allowed domains
            if(allowedDomains.map(r => r[0]).includes(request.domain)){
                allowedDomains.splice(allowedDomains.map(r => r[0]).indexOf(request.domain), 1);
                chrome.storage.local.get("allowedDomains", (res) => {
                    const a = res.allowedDomains || [];
                    a.splice(a.map(r => r[0]).indexOf(request.domain), 1);
                    chrome.storage.local.set({allowedDomains: a});
                });
                return sendResponse({success: true});
            }
            return sendResponse({success: false});

        case "getAllowedDomains": // Return allowed domains, used for example by popup.js | [domain, isTemporary]
            return sendResponse({allowedDomains});

        case "getStatus": // Return whether checking is disabled or not
            return sendResponse({disabled: checkingDisabled});

        case "setStatus": // Set whether checking is disabled or not, for safety reasons you can have it disabled for a session only
            checkingDisabled = request.disabled;
            return sendResponse({disabled: checkingDisabled});

    }
});