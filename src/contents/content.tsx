import { useEffect, useRef, type MutableRefObject } from "react"

import { addMemo } from "~/storage/memo"

export const config = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_start"
}

const DOUBAO_HOST_TAG = "doubao-ai-csui"
const SELECT_BAR_SELECTOR = '[data-testid="select-bar-container"]'
const MEMO_BUTTON_ATTR = "data-shift-memo-button"
const MEMO_BUTTON_WRAPPER_ATTR = "data-shift-memo-wrapper"
const FEEDBACK_RESET_MS = 1600

const MEMO_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M6 3.5A2.5 2.5 0 0 0 3.5 6v12A2.5 2.5 0 0 0 6 20.5h12a2.5 2.5 0 0 0 2.5-2.5V8.268a2.5 2.5 0 0 0-.732-1.768l-3.268-3.268A2.5 2.5 0 0 0 14.732 2.5zM14.5 4.621V8a1 1 0 0 0 1 1h3.379a.5.5 0 0 1 .121.016V18a1 1 0 0 1-1 1h-1.5v-4.25A1.75 1.75 0 0 0 14.75 13h-5.5a1.75 1.75 0 0 0-1.75 1.75V19H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h8.484a.5.5 0 0 1 .016.121M9 19v-4.25a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25V19z"
      clip-rule="evenodd"></path>
  </svg>
`

const CHECK_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M19.704 6.29a1 1 0 0 1 .006 1.414l-9.2 9.28a1 1 0 0 1-1.42-.002l-4.8-4.86a1 1 0 1 1 1.422-1.406l4.09 4.14 8.49-8.56a1 1 0 0 1 1.412-.006"
      clip-rule="evenodd"></path>
  </svg>
`

type MemoButtonState = "idle" | "added" | "duplicate" | "empty" | "error"
type MemoSaveStatus = Exclude<MemoButtonState, "idle">

const BUTTON_VISUALS: Record<
  MemoButtonState,
  {
    title: string
    icon: string
    color?: string
    backgroundColor?: string
  }
> = {
  idle: {
    title: "Add to Memo",
    icon: MEMO_ICON
  },
  added: {
    title: "Added to Memo",
    icon: CHECK_ICON,
    color: "#16a34a",
    backgroundColor: "rgba(22, 163, 74, 0.14)"
  },
  duplicate: {
    title: "Already in Memo",
    icon: MEMO_ICON,
    color: "#d97706",
    backgroundColor: "rgba(217, 119, 6, 0.14)"
  },
  empty: {
    title: "No text selected",
    icon: MEMO_ICON,
    color: "#dc2626",
    backgroundColor: "rgba(220, 38, 38, 0.12)"
  },
  error: {
    title: "Failed to add memo",
    icon: MEMO_ICON,
    color: "#dc2626",
    backgroundColor: "rgba(220, 38, 38, 0.12)"
  }
}

const hasClassPrefix = (element: Element, prefix: string) =>
  Array.from(element.classList).some((className) =>
    className.startsWith(prefix)
  )

const findPrimaryActionGroup = (root: ShadowRoot) => {
  const selectBar = root.querySelector(SELECT_BAR_SELECTOR)
  if (!(selectBar instanceof HTMLElement)) return null

  const actionContainer =
    Array.from(selectBar.children).find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        hasClassPrefix(child, "action-container-")
    ) ||
    Array.from(selectBar.querySelectorAll<HTMLElement>("div")).find((element) =>
      hasClassPrefix(element, "action-container-")
    )

  if (!actionContainer) return null

  return (
    Array.from(actionContainer.children).find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && hasClassPrefix(child, "actions-")
    ) ||
    Array.from(actionContainer.querySelectorAll<HTMLElement>("div")).find(
      (element) => hasClassPrefix(element, "actions-")
    ) ||
    null
  )
}

const renderButtonState = (
  button: HTMLButtonElement,
  state: MemoButtonState
) => {
  const visual = BUTTON_VISUALS[state]
  const icon = button.querySelector<HTMLElement>('[role="img"]')
  if (icon) {
    icon.innerHTML = visual.icon
  }

  button.title = visual.title
  button.setAttribute("aria-label", visual.title)
  button.style.color = visual.color || ""
  button.style.backgroundColor = visual.backgroundColor || ""
}

const showButtonFeedback = (
  button: HTMLButtonElement,
  state: MemoSaveStatus,
  feedbackTimers: Map<HTMLButtonElement, number>
) => {
  renderButtonState(button, state)

  const existingTimer = feedbackTimers.get(button)
  if (existingTimer) {
    window.clearTimeout(existingTimer)
  }

  const timerId = window.setTimeout(() => {
    renderButtonState(button, "idle")
    feedbackTimers.delete(button)
  }, FEEDBACK_RESET_MS)

  feedbackTimers.set(button, timerId)
}

const getSelectedText = (selectionCacheRef: MutableRefObject<string>) => {
  const selectionText = window.getSelection()?.toString().trim() || ""
  if (selectionText) {
    selectionCacheRef.current = selectionText
  }
  return selectionText || selectionCacheRef.current
}

const saveSelectedTextToMemo = async (
  selectionCacheRef: MutableRefObject<string>
): Promise<MemoSaveStatus> => {
  const text = getSelectedText(selectionCacheRef)
  if (!text) {
    return "empty"
  }

  try {
    const result = await addMemo(text)
    if (result === null) {
      return "duplicate"
    }

    chrome.runtime.sendMessage({ type: "MEMO_ADDED" })
    return "added"
  } catch (error) {
    console.error("[Shift Translate] Failed to save memo:", error)
    return "error"
  }
}

const createMemoButton = (
  referenceWrapper: HTMLElement,
  handleClick: (button: HTMLButtonElement) => Promise<void>
) => {
  const wrapper = referenceWrapper.cloneNode(true) as HTMLElement
  wrapper.setAttribute(MEMO_BUTTON_WRAPPER_ATTR, "true")

  const button = wrapper.querySelector("button")
  if (!(button instanceof HTMLButtonElement)) return null

  button.setAttribute(MEMO_BUTTON_ATTR, "true")
  button.setAttribute("data-testid", "select-bar-memo-action")
  button.removeAttribute("aria-describedby")
  button.removeAttribute("data-popupid")
  button.type = "button"
  button.disabled = false

  const contentRight = button.querySelector<HTMLElement>(
    ".semi-button-content-right"
  )
  if (contentRight) {
    contentRight.textContent = ""
  }

  renderButtonState(button, "idle")

  button.addEventListener("mousedown", (event) => {
    event.preventDefault()
    event.stopPropagation()
  })

  button.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    void handleClick(button)
  })

  return wrapper
}

const ShiftTranslateRoot = () => {
  const selectionCacheRef = useRef("")
  const shadowObserversRef = useRef(new Map<ShadowRoot, MutationObserver>())
  const pendingHostTimersRef = useRef(new Map<HTMLElement, number>())
  const feedbackTimersRef = useRef(new Map<HTMLButtonElement, number>())

  useEffect(() => {
    const syncSelection = () => {
      const selectionText = window.getSelection()?.toString().trim() || ""
      if (selectionText) {
        selectionCacheRef.current = selectionText
      }
    }

    const ensureMemoButton = (root: ShadowRoot) => {
      const actionGroup = findPrimaryActionGroup(root)
      if (!actionGroup) return

      const existingButton = actionGroup.querySelector<HTMLButtonElement>(
        `[${MEMO_BUTTON_ATTR}]`
      )
      if (existingButton) return

      const referenceWrapper = Array.from(actionGroup.children).find(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          !child.hasAttribute(MEMO_BUTTON_WRAPPER_ATTR) &&
          !!child.querySelector("button")
      )

      if (!referenceWrapper) return

      const memoButtonWrapper = createMemoButton(
        referenceWrapper,
        async (button) => {
          const status = await saveSelectedTextToMemo(selectionCacheRef)
          showButtonFeedback(button, status, feedbackTimersRef.current)
        }
      )

      if (!memoButtonWrapper) return

      actionGroup.appendChild(memoButtonWrapper)
    }

    const clearPendingHostTimer = (host: HTMLElement) => {
      const timerId = pendingHostTimersRef.current.get(host)
      if (timerId !== undefined) {
        window.clearTimeout(timerId)
        pendingHostTimersRef.current.delete(host)
      }
    }

    const ensureShadowObserved = (root: ShadowRoot) => {
      ensureMemoButton(root)

      if (shadowObserversRef.current.has(root)) return

      const observer = new MutationObserver(() => {
        ensureMemoButton(root)
      })

      observer.observe(root, {
        childList: true,
        subtree: true
      })

      shadowObserversRef.current.set(root, observer)
    }

    const ensureHostObserved = (host: HTMLElement) => {
      if (host.shadowRoot) {
        clearPendingHostTimer(host)
        ensureShadowObserved(host.shadowRoot)
        return
      }

      if (pendingHostTimersRef.current.has(host)) return

      let attempts = 0

      const retry = () => {
        if (!host.isConnected) {
          clearPendingHostTimer(host)
          return
        }

        if (host.shadowRoot) {
          clearPendingHostTimer(host)
          ensureShadowObserved(host.shadowRoot)
          return
        }

        attempts += 1
        if (attempts >= 40) {
          clearPendingHostTimer(host)
          return
        }

        const timerId = window.setTimeout(retry, 250)
        pendingHostTimersRef.current.set(host, timerId)
      }

      const timerId = window.setTimeout(retry, 50)
      pendingHostTimersRef.current.set(host, timerId)
    }

    const scanNodeForHosts = (node: ParentNode) => {
      node
        .querySelectorAll<HTMLElement>(DOUBAO_HOST_TAG)
        .forEach(ensureHostObserved)
    }

    document.addEventListener("selectionchange", syncSelection)

    if (document.documentElement) {
      scanNodeForHosts(document)
    }

    const documentObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return

          if (node.localName === DOUBAO_HOST_TAG) {
            ensureHostObserved(node as HTMLElement)
          }

          scanNodeForHosts(node)
        })
      }
    })

    documentObserver.observe(document, {
      childList: true,
      subtree: true
    })

    return () => {
      document.removeEventListener("selectionchange", syncSelection)
      documentObserver.disconnect()

      shadowObserversRef.current.forEach((observer) => {
        observer.disconnect()
      })
      shadowObserversRef.current.clear()

      pendingHostTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId)
      })
      pendingHostTimersRef.current.clear()

      feedbackTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId)
      })
      feedbackTimersRef.current.clear()
    }
  }, [])

  return null
}

export default ShiftTranslateRoot
