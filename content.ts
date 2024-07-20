import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*/*/issues/*"],
  all_frames: true
}

const targetUrlRegex = /^https:\/\/github.com\/(.+)\/(.+)\/issues\/([0-9]+).*$/

// tabのURLが変わったらbackground.tsにメッセージ送信する
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // listen for messages sent from background.js
  const titleElement = document.getElementsByName("issue[title]")
  const bodyElement = document.getElementsByName("issue[body]")
  const assigneeList = document.querySelectorAll(
    "#partial-discussion-sidebar > div.discussion-sidebar-item.sidebar-assignee.js-discussion-sidebar-item > form > span > p > span > a.assignee.Link--primary > span"
  )
  const labelsList = document.querySelectorAll(
    "#partial-discussion-sidebar > div:nth-child(2) > div > a > span"
  )

  let title = ""
  let body = ""
  let assignees: string[] = []
  let labels: string[] = []
  if (titleElement.length > 0 && (titleElement[0] as HTMLInputElement).value) {
    title = encodeURI((titleElement[0] as HTMLInputElement).value!)
      .trim()
      .replace(/#/g, "%23")
      .replace(/&/g, "%26")
      .replace(/;/g, "%3B")
  }
  if (bodyElement.length > 0 && bodyElement[0].textContent) {
    body = encodeURI(bodyElement[0].textContent)
      .trim()
      .replace(/#/g, "%23")
      .replace(/&/g, "%26")
      .replace(/;/g, "%3B")
  }
  if (assigneeList && assigneeList.length > 0) {
    assigneeList.forEach((node) => {
      if (node.textContent) {
        assignees.push(node.textContent)
      }
    })
  }
  if (labelsList && labelsList.length > 0) {
    labelsList.forEach((node) => {
      if (node.textContent) {
        labels.push(node.textContent)
      }
    })
  }

  if (request.newTab) {
    sendResponse({
      title,
      body,
      assignees,
      labels
    })
  } else {
    const result = window.location.href.match(targetUrlRegex)

    window.location.href = `https://github.com/${result[1]}/${result[2]}/issues/new?assignees=${assignees}&title=${title}&body=${body}&labels=${labels}`
    sendResponse()
  }
})
