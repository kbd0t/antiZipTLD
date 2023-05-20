const url = new URL(new URLSearchParams(window.location.search).get("url"))


document.title = `Before you continue - ${url.host}`;
document.querySelectorAll('.hostname').forEach(el => el.innerHTML = url.host)

document.querySelector('#goback-button').addEventListener('click', () => window.history.back())
document.querySelector('#continue-button').addEventListener('click', () => {
    const rememberChoice = document.querySelector('#continue-remember').checked;
    chrome.extension.sendMessage({type: "addDomain", domain: url.host, rememberChoice}, (res) => {if(res.success) location.href = url.href})
})
document.querySelector('#details-button').addEventListener('click', () => window.open('https://youtu.be/GCVJsz7EODA?t=97'))
