import { useEffect, useRef, useState } from "react"

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

function rootPosition(x: number, maxY: number, minY: number): Position {
  const maxHeight = 400
  const maxWidth = 400
  const position: Position = {
    maxHeight: `${maxHeight}px`,
    maxWidth: `${maxWidth}px`
  }
  if (!x && !maxY && !minY) {
    position["top"] = "50%"
    position["left"] = "50%"
    position["transform"] = "translate(-50%, -50%)"
  } else {
    if (maxY >= window.innerHeight - maxWidth) {
      position["bottom"] = window.innerHeight - minY + "px"
    } else {
      position["top"] = maxY + "px"
    }
    if (x >= window.innerWidth - maxHeight) {
      position["right"] = window.innerWidth - x + "px"
    } else {
      position["left"] = x + "px"
    }
  }
  return position
}

function getSelectionFromWindow(win: Window, mx: number, my: number) {
  try {
    const selection = win.getSelection()
    const text = selection?.toString().trim() || ""
    if (!selection || !selection.rangeCount || !text) return {}

    const range = selection.getRangeAt(0)
    const rects = range.getClientRects() // 获取所有选中片段的矩形
    let x = 0
    let maxY = 0
    let minY = 0
    if (rects.length > 0) {
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i] // 选中区域的起点
        if (i == 0) {
          x = rect.left
          maxY = rect.bottom
          minY = rect.top
          continue
        }
        x = Math.min(x, rect.left)
        maxY = Math.max(maxY, rect.bottom)
        minY = Math.min(minY, rect.top)
      }
    }
    if (!x && !maxY && !minY) {
      x = mx
      maxY = my
      minY = my
    }
    const position = rootPosition(x, maxY, minY)
    return {
      text,
      position
    }
  } catch (e) {
    // Cross-origin iframe, skip
    return {}
  }
}

function getSelectionFromFrame(
  win: Window,
  mx: number,
  my: number,
  offsetX: number = 0,
  offsetY: number = 0
) {
  // 首先尝试获取当前 window 的选区
  let result = getSelectionFromWindow(win, mx, my)
  if (result.text) {
    // 如果有偏移量，调整坐标
    if (offsetX || offsetY) {
      if (result.position.left) {
        result.position.left = `${parseInt(result.position.left) + offsetX}px`
      }
      if (result.position.right) {
        result.position.right = `${parseInt(result.position.right) + offsetX}px`
      }
      if (result.position.top) {
        result.position.top = `${parseInt(result.position.top) + offsetY}px`
      }
      if (result.position.bottom) {
        result.position.bottom = `${parseInt(result.position.bottom) + offsetY}px`
      }
    }
    return result
  }

  // 递归遍历子 iframe
  try {
    const frames = win.document.querySelectorAll("iframe")
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      try {
        const frameWindow = (frame as HTMLIFrameElement).contentWindow
        if (frameWindow) {
          const frameRect = frame.getBoundingClientRect()
          const newOffsetX = offsetX + frameRect.left
          const newOffsetY = offsetY + frameRect.top
          const nestedResult = getSelectionFromFrame(
            frameWindow,
            mx,
            my,
            newOffsetX,
            newOffsetY
          )
          if (nestedResult.text) {
            return nestedResult
          }
        }
      } catch (e) {
        // Cross-origin iframe, skip
        continue
      }
    }
  } catch (e) {
    // 无法访问 iframe 文档，跳过
  }

  return {}
}

type Position = {
  top?: string
  bottom?: string
  left?: string
  right?: string
  transform?: string
  maxWidth?: string
  maxHeight?: string
}

type Info = {
  text: string
  position: Position
  display: boolean
}

type Mouse = {
  x: number
  y: number
}

const useShift = () => {
  const [info, setInfo] = useState<Info>({
    text: "",
    position: {},
    display: false
  })

  //   弹窗点击关闭
  const handleClickOutside = (event: MouseEvent) => {
    if (!infoRef.current.display) {
      return
    }
    const path = event.composedPath()
    if (path.includes(ref.current)) return
    setInfo((item) => ({
      ...item,
      display: false
    }))
  }

  // 管理点击外部关闭弹窗的逻辑
  useEffect(() => {
    if (info.display) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [info.display])

  // 监听选中事件，选中后只显示空弹窗（不获取文字）
  useEffect(() => {
    let selectionTimer: ReturnType<typeof setTimeout> | null = null

    const handleSelectionChange = () => {
      // 清除之前的定时器
      if (selectionTimer) {
        clearTimeout(selectionTimer)
      }

      // 延迟一小段时间再检查，确保拖动结束后再触发
      selectionTimer = setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim() || ""
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null

        // 只有真正选中文本时才显示弹窗
        if (
          text &&
          text.length > 0 &&
          range &&
          range.getClientRects().length > 0
        ) {
          const rects = range.getClientRects()
          let x = rects[0].left
          let maxY = rects[0].bottom
          let minY = rects[0].top
          for (let i = 1; i < rects.length; i++) {
            x = Math.min(x, rects[i].left)
            maxY = Math.max(maxY, rects[i].bottom)
            minY = Math.min(minY, rects[i].top)
          }
          const position = rootPosition(x, maxY, minY)
          console.log("[Shift Translate] Selection position:", position)
          setInfo({
            text: "", // 不获取文字，留空
            position,
            display: true
          })
        } else {
          // 没有选中文本时隐藏弹出框
          setInfo((item) => ({
            ...item,
            display: false
          }))
        }
      }, 100) // 100ms 延迟，等待拖动结束
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      if (selectionTimer) {
        clearTimeout(selectionTimer)
      }
    }
  }, [])

  const infoRef = useRef(info)
  useEffect(() => {
    infoRef.current = info
  }, [info])

  const ref = useRef<HTMLDivElement>(null)
  return {
    ref,
    info
  }
}

export { useShift }
