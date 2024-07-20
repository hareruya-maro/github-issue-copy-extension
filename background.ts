export {}
const targetUrlRegex = /^https:\/\/github.com\/(.+)\/(.+)\/issues\/([0-9]+).*$/

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateContextMenu(tab.url)
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateContextMenu(tab.url)
  })
})

function updateContextMenu(url: string) {
  chrome.contextMenus.removeAll(() => {
    if (url.includes("github.com") && url.match(/issues\/\d+/)) {
      // メニューを作る
      chrome.contextMenus.create({
        id: "copy_issue_new_tab",
        title: chrome.i18n.getMessage("MenuNameNewTab")
      })
      chrome.contextMenus.create({
        id: "copy_issue_this_tab",
        title: chrome.i18n.getMessage("MenuNameCurrentTab")
      })
    }
  })
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  // メニュー項目がクリックされたときの処理
  if (info.menuItemId === "exampleMenu") {
    // Example.comのメニュー処理
  } else if (info.menuItemId === "githubMenu") {
    // GitHubのメニュー処理
  } else {
    // デフォルトのメニュー処理
  }
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.tabs.sendMessage(
    tab.id,
    { action: "getTagValue", newTab: info.menuItemId === "copy_issue_new_tab" },
    (response) => {
      if (response?.title) {
        const { title, body, assignees, labels } = response
        const result = tab?.url?.match(targetUrlRegex)
        if (info.menuItemId === "copy_issue_new_tab") {
          chrome.tabs.create(
            {
              url: `https://github.com/${result[1]}/${result[2]}/issues/new?assignees=${assignees}&title=${title}&body=${body}&labels=${labels}`
            },
            (newTab) => {
              chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === newTab.id && info.status === "complete") {
                  chrome.tabs.onUpdated.removeListener(listener)
                  chrome.tabs.sendMessage(newTab.id, {
                    action: "setContent",
                    value: response.value
                  })
                }
              })
            }
          )
        }
      }
    }
  )
})
