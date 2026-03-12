import { Button, Card, Input, List, message, Modal } from "antd"
import React, { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import {
  addMemo,
  deleteMemo,
  getMemos,
  updateMemo,
  type Memo
} from "~/storage/memo"

const { TextArea } = Input
const storage = new Storage()

const pixelBorderStyle = {
  border: "2px solid #000",
  borderRadius: 0,
  boxShadow: "4px 4px 0 #000"
}

export const MemoPage = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [newMemoContent, setNewMemoContent] = useState("")
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

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

    return () => {
      storage.unwatch(watchCallback)
    }
  }, [])

  const loadMemos = async () => {
    const data = await getMemos()
    setMemos(data)
  }

  const handleAddMemo = async () => {
    if (!newMemoContent.trim()) {
      messageApi.warning("Please enter memo content")
      return
    }
    await addMemo(newMemoContent)
    setNewMemoContent("")
    await loadMemos()
    messageApi.success("Memo added")
  }

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

  return (
    <div
      style={{
        minHeight: 520,
        background: "#fff",
        padding: 16
      }}>
      {contextHolder}
      <Card
        style={{ ...pixelBorderStyle, background: "#fff" }}
        title={
          <div
            style={{ fontWeight: 700, fontSize: 16, fontFamily: "monospace" }}>
            {">"} MEMOS_
          </div>
        }>
        <div style={{ marginBottom: 16 }}>
          <TextArea
            value={newMemoContent}
            onChange={(e) => setNewMemoContent(e.target.value)}
            placeholder="Write a new memo..."
            rows={3}
            style={{
              marginBottom: 8,
              border: "2px solid #000",
              borderRadius: 0,
              fontFamily: "monospace"
            }}
          />
          <Button
            type="primary"
            onClick={handleAddMemo}
            block
            style={{
              ...pixelBorderStyle,
              background: "#000",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "monospace"
            }}>
            [ ADD MEMO ]
          </Button>
        </div>

        <List
          dataSource={memos}
          renderItem={(memo) => (
            <List.Item
              style={{
                background: "#fff",
                padding: 12,
                marginBottom: 8,
                border: "2px solid #000",
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
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      color: "#000",
                      fontFamily: "monospace",
                      fontSize: 12
                    }}>
                    {memo.content}
                  </div>
                }
              />
            </List.Item>
          )}
        />

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
              border: "2px solid #000",
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
    </div>
  )
}
