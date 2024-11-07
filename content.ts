import { NodeHtmlMarkdown } from "node-html-markdown"
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*/*/issues/*"],
  all_frames: true
}

const targetUrlRegex = /^https:\/\/github.com\/(.+)\/(.+)\/issues\/([0-9]+).*$/

// tabのURLが変わったらbackground.tsにメッセージ送信する
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // listen for messages sent from background.js
  const titleElement = document.getElementsByClassName("markdown-title")
  const bodyElementList = document.getElementsByClassName("markdown-body")
  const bodyElement = Array.from(bodyElementList).filter((node) => {
    return node.parentElement.getAttributeNames().includes("data-testid")
  })

  const assigneeList = document.querySelectorAll(
    '[data-testid="issue-assignees"]'
  )
  const labelsList = document.querySelectorAll('[data-testid="issue-labels"]')

  let title = ""
  let body = ""
  let assignees: string[] = []
  let labels: string[] = []
  if (titleElement.length > 0 && (titleElement[0] as HTMLElement).innerText) {
    title = encodeURI((titleElement[0] as HTMLElement).innerText!)
      .trim()
      .replace(/#/g, "%23")
      .replace(/&/g, "%26")
      .replace(/;/g, "%3B")
  }
  if (bodyElement.length > 0 && bodyElement) {
    const markdown = NodeHtmlMarkdown.translate(bodyElement[0].innerHTML, {})

    body = encodeURI(markdown)
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
      assignees: assignees.join(","),
      labels: labels.join(",")
    })
  } else {
    const result = window.location.href.match(targetUrlRegex)

    window.location.href = `https://github.com/${result[1]}/${result[2]}/issues/new?assignees=${assignees}&title=${title}&body=${body}&labels=${labels}`
    sendResponse()
  }
})
