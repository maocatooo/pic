import { Button, Card, Input, List, message, Modal } from "antd"
import React, { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import { deleteMemo, getMemos, updateMemo, type Memo } from "~/storage/memo"

const { Search } = Input
const TextArea = Input.TextArea
const storage = new Storage({
  area: "local"
})

const pixelBorderStyle = {}

const listContainerStyle = {}

const listContainerClassName = ""

export const MemoPage = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null)
  const [expandedMemoId, setExpandedMemoId] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const [showChatButton, setShowChatButton] = useState(true)
  const [chatInput, setChatInput] = useState("")

  useEffect(() => {
    loadMemos()

    // Watch for memo changes from other tabs/components
    const watchCallback = (
      changes: Record<string, Storage.ChangeRecord<any>>
    ) => {
      if (changes.memoKey) {
        loadMemos()
      }
    }

    storage.watch(watchCallback)

    // Listen for messages from content script when memo is added
    const messageListener = (message: any, sender: any, sendResponse: any) => {
      if (message.type === "MEMO_ADDED") {
        loadMemos()
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      storage.unwatch(watchCallback)
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  const loadMemos = async () => {
    const data = await getMemos()
    setMemos(data)
  }

  const filteredMemos = memos.filter((memo) =>
    memo.content.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo)
    setEditingContent(memo.content)
  }

  const handleSaveMemo = async () => {
    if (!editingContent.trim()) {
      messageApi.warning("Memo content cannot be empty")
      return
    }
    if (editingMemo) {
      await updateMemo(editingMemo.id, editingContent)
      setEditingMemo(null)
      await loadMemos()
      messageApi.success("Memo updated")
    }
  }

  const handleDeleteMemo = (memo: Memo) => {
    setDeleteMemoId(memo.id)
  }

  const confirmDelete = async () => {
    if (deleteMemoId) {
      await deleteMemo(deleteMemoId)
      await loadMemos()
      setDeleteMemoId(null)
      messageApi.success("Memo deleted")
    }
  }

  const cancelDelete = () => {
    setDeleteMemoId(null)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) {
      messageApi.warning("Input cannot be empty")
      return
    }
    
    // Check for duplicate before adding
    const isDuplicate = memos.some((m) => m.content === chatInput.trim())
    if (isDuplicate) {
      messageApi.warning("This memo already exists")
      setChatInput("")
      return
    }
    
    // TODO: Implement chat/AI functionality here
    messageApi.info("Chat feature coming soon: " + chatInput)
    setChatInput("")
  }

  return (
    <div
      style={{
        background: "#fff",
        padding: 16,
        paddingBottom: 80,
        boxSizing: "border-box"
      }}>
      {contextHolder}
      <Card
        style={{
          ...pixelBorderStyle,
          background: "#fff",
          border: "1px solid #000",
          height: "calc(80vh)"
        }}
        title={
          <div
            style={{ fontWeight: 700, fontSize: 16, fontFamily: "monospace" }}>
            {">"} MEMOS_
          </div>
        }>
        <div style={{ marginBottom: 16 }}>
          <Search
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search memos..."
            allowClear
            className=""
            style={{
              borderRadius: 0,
              fontFamily: "monospace"
            }}
          />
        </div>

        <div
          style={{
            height: "calc(63vh)",
            overflowY: "scroll",
            overflowX: "hidden"
          }}>
          <List
            dataSource={filteredMemos}
            locale={{ emptyText: "No memos found" }}
            renderItem={(memo) => (
              <List.Item
                style={{
                  background: "#fff",
                  padding: 12,
                  marginBottom: 8,
                  border: "1px solid #000",
                  borderRadius: 0
                }}>
                <List.Item.Meta
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between"
                      }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#666",
                          fontFamily: "monospace"
                        }}>
                        {formatTime(memo.createdAt)}
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Button
                          type="link"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditMemo(memo)
                          }}
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            padding: 0,
                            minWidth: "auto",
                            height: "auto",
                            color: "#000",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer"
                          }}>
                          [EDIT]
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMemo(memo)
                          }}
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#000",
                            padding: 0,
                            minWidth: "auto",
                            height: "auto",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer"
                          }}>
                          [DEL]
                        </Button>
                      </div>
                    </div>
                  }
                  description={
                    <div>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          color: "#000",
                          fontFamily: "monospace",
                          fontSize: 12,
                          ...(expandedMemoId !== memo.id
                            ? {
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }
                            : {})
                        }}>
                        {memo.content}
                      </div>
                      {memo.content.split("\n").length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedMemoId(
                              expandedMemoId === memo.id ? null : memo.id
                            )
                          }}
                          style={{
                            marginTop: 4,
                            background: "none",
                            border: "none",
                            color: "#666",
                            fontFamily: "monospace",
                            fontSize: 11,
                            cursor: "pointer",
                            padding: 0
                          }}>
                          {expandedMemoId === memo.id
                            ? "[ COLLAPSE ]"
                            : "[ ... ]"}
                        </button>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        <Modal
          title={
            <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
              {">"} EDIT_MEMO_
            </span>
          }
          open={!!editingMemo}
          onOk={handleSaveMemo}
          onCancel={() => setEditingMemo(null)}
          okText="SAVE"
          cancelText="CANCEL"
          okButtonProps={{
            style: {
              ...pixelBorderStyle,
              background: "#000",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "monospace"
            }
          }}
          cancelButtonProps={{
            style: {
              ...pixelBorderStyle,
              background: "#fff",
              color: "#000",
              fontWeight: 700,
              fontFamily: "monospace"
            }
          }}>
          <TextArea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            rows={6}
            placeholder="Edit memo content..."
            style={{
              border: "1px solid #000",
              borderRadius: 0,
              fontFamily: "monospace"
            }}
          />
        </Modal>

        <Modal
          title={
            <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
              DELETE_CONFIRM
            </span>
          }
          open={!!deleteMemoId}
          onOk={confirmDelete}
          onCancel={cancelDelete}
          okText="[ DELETE ]"
          cancelText="[ CANCEL ]"
          okButtonProps={{
            style: {
              ...pixelBorderStyle,
              background: "#000",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "monospace"
            }
          }}
          cancelButtonProps={{
            style: {
              ...pixelBorderStyle,
              background: "#fff",
              color: "#000",
              fontWeight: 700,
              fontFamily: "monospace"
            }
          }}>
          <span style={{ fontFamily: "monospace" }}>
            Are you sure you want to delete this memo?
          </span>
        </Modal>
      </Card>

      {/* Floating Chat Button / Chat Input */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16
        }}>
        {showChatButton ? (
          <Button
            onClick={() => setShowChatButton(false)}
            style={{
              ...pixelBorderStyle,
              background: "#000",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "monospace",
              width: "100%",
              height: 44,
              fontSize: 14,
              borderRadius: 0
            }}>
            {">"} CHAT_
          </Button>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "#fff",
              border: "1px solid #000"
            }}>
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onPressEnter={handleChatSubmit}
              placeholder="Type your message..."
              style={{
                flex: 1,
                border: "none",
                borderRadius: 0,
                fontFamily: "monospace"
              }}
              autoFocus
            />
            <Button
              onClick={handleChatSubmit}
              style={{
                ...pixelBorderStyle,
                background: "#000",
                color: "#fff",
                fontWeight: 700,
                fontFamily: "monospace",
                borderRadius: 0
              }}>
              SEND
            </Button>
            <Button
              onClick={() => setShowChatButton(true)}
              style={{
                ...pixelBorderStyle,
                background: "#fff",
                color: "#000",
                fontWeight: 700,
                fontFamily: "monospace",
                borderRadius: 0
              }}>
              ×
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
