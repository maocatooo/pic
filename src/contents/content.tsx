import styleText from "data-text:./ScrollableDiv.module.css"
import { useEffect, useState } from "react"

import { useShift } from "./hooks"
import styles from "./ScrollableDiv.module.css"
import { useTranslate } from "./translate"
import { addMemo } from "~/storage/memo"

export const config = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_start"
}



export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const Paragraph = ({ text }) => {
  const [ps, setPs] = useState([])
  useEffect(() => {
    const newPS = text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .filter((line) => line.trim() !== "")
    setPs(newPS)
  }, [text])
  return (
    <>
      {ps.map((paragraph, index) => (
        <div key={index}>{paragraph}</div>
      ))}
    </>
  )
}

const TranslatePop = () => {
  const { ref, info } = useShift()
  const [showTranslate, setShowTranslate] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [memoAdded, setMemoAdded] = useState(false)
  const { response, sendRequest } = useTranslate()

  const getSelectedText = () => {
    const text = window.getSelection()?.toString().trim() || ""
    console.log("[Shift Translate] Get selected text:", text)
    return text
  }

  const handleTranslate = () => {
    const text = selectedText || getSelectedText()
    setCurrentText(text)
    setShowTranslate(true)
    sendRequest(text)
  }

  const handleMemo = async () => {
    const text = selectedText || getSelectedText()
    console.log("[Shift Translate] Save to memo:", text)
    if (!text) return
    
    try {
      await addMemo(text)
      setMemoAdded(true)
    } catch (error) {
      console.error("[Shift Translate] Failed to save memo:", error)
    }
  }

  // 每次弹窗位置变化时（即新的选中），重置所有状态
  useEffect(() => {
    if (info.display) {
      setShowTranslate(false)
      // 保存选中的文字，避免点击按钮时选区丢失
      const text = window.getSelection()?.toString().trim() || ""
      setSelectedText(text)
      setCurrentText("")
      setMemoAdded(false)
    }
  }, [info.position, info.display])
  console.log(
    "[Shift Translate] Render TranslatePop",
    showTranslate,
    currentText,
    info.display
  )
  return (
    <div
      className={styles.scrollableDiv}
      ref={ref}
      style={{
        ...info.position,
        display: info.display ? "block" : "none"
      }}>
      {!showTranslate && (
        <>
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "6px 8px",
              justifyContent: "flex-end",
              background: "rgba(255, 255, 255, 0.05)"
            }}>
            <button
              onClick={() => handleTranslate()}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "14px",
                transition: "background-color 0.2s",
                width: "36px",
                minWidth: "36px",
                height: "32px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)"
              }}
              title="Translate">
              🌐
            </button>
            <button
              onClick={handleMemo}
              style={{
                background: memoAdded ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 255, 255, 0.1)",
                border: "none",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: memoAdded ? "#4caf50" : "white",
                fontSize: "14px",
                transition: "background-color 0.2s",
                width: "36px",
                minWidth: "36px",
                height: "32px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = memoAdded
                  ? "rgba(76, 175, 80, 0.4)"
                  : "rgba(255, 255, 255, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = memoAdded
                  ? "rgba(76, 175, 80, 0.3)"
                  : "rgba(255, 255, 255, 0.1)"
              }}
              title="Add to Memo">
              {memoAdded ? "✓" : "📝"}
            </button>
          </div>
        </>
      )}
      {showTranslate && (
        <>
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
            <Paragraph text={currentText} />
          </div>
          <div
            style={{
              padding: "8px 10px",
              background: "rgba(255, 255, 255, 0.05)"
            }}>
            {response ? <Paragraph text={response} /> : "Loading..."}
          </div>
        </>
      )}
    </div>
  )
}

const ShiftTranslateRoot = () => {
  return <TranslatePop />
}

export default ShiftTranslateRoot
