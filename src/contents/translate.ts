import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { useState } from "react"

import { getConf } from "~/storage/conf"

const prompt = (sourceLang, targetLang) => {
  return `
你是一名专业的多语言同声传译员，正在联合国高级别会议中为各国领导人进行实时翻译。你的翻译必须极其准确、忠实且专业，任何误解都可能导致严重后果。请严格遵守以下要求：
【必须遵守的规则】
保持原文格式：严格保留所有标点符号、换行、空格、列表、代码块等格式细节，绝不增删或更改。
仅翻译内容本身：不添加、解释、扩展或省略原文内容，输出仅为翻译结果。
表达自然地道：使用目标语言中最自然、流畅、符合语境的表达，避免生硬直译。
特殊内容原样保留：数字、专有名词、代码、符号等内容请保持不变，不翻译、不调整格式。
不输出任何与翻译无关的内容：不输出注释、说明、提示、标签等。
【当前设置】
源语言: ${sourceLang || 'auto'}
目标语言: ${targetLang || 'zh-cn'}
【输入格式】
[目标语言代码] 待翻译内容
【输出格式】
翻译结果（仅翻译内容本身，保持原文格式）
【示例】
输入: [zh-cn] Hello world!
输出: 你好，世界！
输入: [en] 你好，世界！
输出: Hello, world!
请严格按照上述规则进行翻译，切勿遗漏任何细节。现在开始翻译任务：
`
}


enum TP {
  GOOGLE,
  OPENAI
}

class Translate {
  private conf:Awaited<ReturnType<typeof getConf>>

  constructor(conf) {
    this.conf = conf
  }

  async openai(t, setResponse) {
    return new Promise(async (resolve, reject) => {
      const client = new OpenAI({
        dangerouslyAllowBrowser: true,
        baseURL: this.conf.openai.OPENAI_BASEURL,
        apiKey: this.conf.openai.OPENAI_APIKEY,
      })
      const pt: Array<ChatCompletionMessageParam> = [
        { role: "system", content: prompt(this.conf.sourceLang, this.conf.targetLang) },
      ]
      const stream = await client.chat.completions.create({
        messages: [...pt, { role: "user", content: `${t}` }],
        model: this.conf.openai.OPENAI_MODEL,
        stream: true // 启用流式响应
      })
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ""
        setResponse((prev) => prev + content) // 更新响应内容
      }
      resolve(null)
    })
  }

  async google(t, setResponse) {
    return new Promise(async (resolve, reject) => {
      const formData = new URLSearchParams()
      formData.append("q", t)
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/t?client=gtx&dt=t&sl=${this.conf.sourceLang}&tl=${this.conf.targetLang}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData.toString()
        }
      )
      const data = await response.json()

      setResponse(data[0][0])
      resolve(null)
    })
  }

  async trans(t, setResponse) {
    switch (this.conf.tp) {
      case TP.GOOGLE:
        return this.google(t, setResponse)
      case TP.OPENAI:
        return this.openai(t, setResponse)
    }
  }
}

const useTranslate = () => {
  const [response, setResponse] = useState("") // 存储流式响应的内容
  const [isLoading, setIsLoading] = useState(false) // 加载状态
  const [error, setError] = useState(null) // 错误信息

  // 发送流式请求的函数
  const sendRequest = async (tx) => {
    const conf = await getConf()
    setIsLoading(true)
    setError(null)
    setResponse("")
    try {
      new Translate(conf).trans(tx, setResponse)
    } catch (err) {
      setError(err.message || "An error occurred") // 捕获错误
    } finally {
      setIsLoading(false) // 结束加载状态
    }
  }

  return {
    response, // 流式响应的内容
    isLoading, // 是否正在加载
    error, // 错误信息
    sendRequest // 发送请求的函数
  }
}

export { useTranslate }
