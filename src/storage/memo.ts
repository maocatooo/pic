import { Storage } from "@plasmohq/storage"

const storage = new Storage({
  area: "local"
})

const memoKey = "memoKey"

type Memo = {
  id: string
  content: string
  createdAt: number
  updatedAt: number
}

const getMemos = async (): Promise<Memo[]> => {
  const memos = (await storage.get(memoKey)) as Memo[]
  return memos || []
}

const setMemos = async (memos: Memo[]) => {
  await storage.set(memoKey, memos)
  return memos
}

const addMemo = async (content: string): Promise<Memo | null> => {
  const memos = await getMemos()
  
  // Check for duplicate content
  const isDuplicate = memos.some((m) => m.content === content)
  if (isDuplicate) {
    return null
  }
  
  const now = Date.now()
  const newMemo: Memo = {
    id: crypto.randomUUID(),
    content,
    createdAt: now,
    updatedAt: now
  }
  memos.unshift(newMemo)
  await setMemos(memos)
  return newMemo
}

const updateMemo = async (
  id: string,
  content: string
): Promise<Memo | null> => {
  const memos = await getMemos()
  const index = memos.findIndex((m) => m.id === id)
  if (index === -1) return null
  memos[index] = {
    ...memos[index],
    content,
    updatedAt: Date.now()
  }
  await setMemos(memos)
  return memos[index]
}

const deleteMemo = async (id: string): Promise<boolean> => {
  const memos = await getMemos()
  const filtered = memos.filter((m) => m.id !== id)
  if (filtered.length === memos.length) return false
  await setMemos(filtered)
  return true
}

const clearMemos = async (): Promise<void> => {
  await storage.set(memoKey, [])
}

export { getMemos, setMemos, addMemo, updateMemo, deleteMemo, clearMemos }
export type { Memo }
