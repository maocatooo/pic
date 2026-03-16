import { Button, Card, Form, Input, Select } from "antd"
import React, { useEffect, useState } from "react"

import { getConf, setConf, TP } from "~/storage/conf"

const pixelBorderStyle = {
  border: "1px solid #000",
  borderRadius: 0,
  boxShadow: "4px 4px 0 #000"
}

export const SettingsPage = () => {
  const [config, setConfig] = useState<Awaited<ReturnType<typeof getConf>>>({})

  useEffect(() => {
    getConf().then((item) => {
      setConfig(item)
    })
  }, [])
  useEffect(() => {
    setConf(config)
  }, [config])

  const onChange = (value) => {
    setConfig((item) => {
      return {
        ...item,
        tp: value
      }
    })
  }

  return (
    <div
      style={{
        minHeight: 520,
        background: "#fff",
        padding: 16
      }}>
      <Card
        style={{ ...pixelBorderStyle, background: "#fff", width: "100%" }}
        title={
          <div
            style={{ fontWeight: 700, fontSize: 16, fontFamily: "monospace" }}>
            {">"} SETTINGS_
          </div>
        }>
        <div
          style={{
            color: "#666",
            marginBottom: 16,
            fontSize: 12,
            fontFamily: "monospace"
          }}>
          {">"} CONFIGURE_TRANSLATION_
        </div>
        <Form layout="vertical">
          <Form.Item
            label={
              <span
                style={{
                  fontWeight: 700,
                  fontFamily: "monospace",
                  fontSize: 12
                }}>
                [ SOURCE_LANG ]
              </span>
            }
            style={{ marginBottom: 12 }}>
            <Select
              value={config.sourceLang}
              onChange={(e) => {
                setConfig((item) => {
                  return {
                    ...item,
                    sourceLang: e
                  }
                })
              }}
              options={[
                { value: "auto", label: <span>Auto Detect</span> },
                { value: "zh-cn", label: <span>Chinese</span> },
                { value: "ja", label: <span>Japanese</span> },
                { value: "en", label: <span>English</span> }
              ]}
              style={{
                width: "100%",
                border: "1px solid #000",
                borderRadius: 0,
                fontFamily: "monospace"
              }}
            />
          </Form.Item>
          <Form.Item
            label={
              <span
                style={{
                  fontWeight: 700,
                  fontFamily: "monospace",
                  fontSize: 12
                }}>
                [ TARGET_LANG ]
              </span>
            }
            style={{ marginBottom: 12 }}>
            <Select
              value={config.targetLang}
              onChange={(e) => {
                setConfig((item) => {
                  return {
                    ...item,
                    targetLang: e
                  }
                })
              }}
              options={[
                { value: "zh-cn", label: <span>Chinese</span> },
                { value: "ja", label: <span>Japanese</span> },
                { value: "en", label: <span>English</span> }
              ]}
              style={{
                width: "100%",
                border: "1px solid #000",
                borderRadius: 0,
                fontFamily: "monospace"
              }}
            />
          </Form.Item>
          <Form.Item
            label={
              <span
                style={{
                  fontWeight: 700,
                  fontFamily: "monospace",
                  fontSize: 12
                }}>
                [ TRANSLATION_SVC ]
              </span>
            }
            style={{ marginBottom: 12 }}>
            <Select
              onChange={onChange}
              value={config.tp}
              options={[
                { value: 0, label: <span>Google</span> },
                { value: 1, label: <span>OpenAI</span> }
              ]}
              style={{
                width: "100%",
                border: "1px solid #000",
                borderRadius: 0,
                fontFamily: "monospace"
              }}
            />
          </Form.Item>
          {config.tp === TP.OPENAI && (
            <>
              <div
                style={{ borderTop: "1px solid #000", margin: "16px 0 11px 0" }}
              />
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: 12
                    }}>
                    [ API_KEY ]
                  </span>
                }
                style={{ marginBottom: 12 }}>
                <Input
                  value={config.openai?.OPENAI_APIKEY}
                  onChange={(e) => {
                    setConfig((item) => {
                      return {
                        ...item,
                        openai: {
                          ...item.openai,
                          OPENAI_APIKEY: e.target.value
                        }
                      }
                    })
                  }}
                  placeholder="sk-..."
                  style={{
                    width: "100%",
                    border: "1px solid #000",
                    borderRadius: 0,
                    fontFamily: "monospace"
                  }}
                />
              </Form.Item>
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: 12
                    }}>
                    [ MODEL ]
                  </span>
                }
                style={{ marginBottom: 12 }}>
                <Input
                  value={config.openai?.OPENAI_MODEL}
                  onChange={(e) => {
                    setConfig((item) => {
                      return {
                        ...item,
                        openai: {
                          ...item.openai,
                          OPENAI_MODEL: e.target.value
                        }
                      }
                    })
                  }}
                  placeholder="gpt-3.5-turbo"
                  style={{
                    width: "100%",
                    border: "1px solid #000",
                    borderRadius: 0,
                    fontFamily: "monospace"
                  }}
                />
              </Form.Item>
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: 12
                    }}>
                    [ BASE_URL ]
                  </span>
                }
                style={{ marginBottom: 0 }}>
                <Input
                  value={config.openai?.OPENAI_BASEURL}
                  onChange={(e) => {
                    setConfig((item) => {
                      return {
                        ...item,
                        openai: {
                          ...item.openai,
                          OPENAI_BASEURL: e.target.value
                        }
                      }
                    })
                  }}
                  placeholder="https://api.openai.com/v1"
                  style={{
                    width: "100%",
                    border: "2px solid #000",
                    borderRadius: 0,
                    fontFamily: "monospace"
                  }}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </div>
  )
}
