import { ConfigProvider, Tabs } from "antd"
import { useState } from "react"

import { MemoPage } from "~/sidepanel/memo"
import { SettingsPage } from "~/sidepanel/settings"

import "./sidepanel.css"

function SidePanel() {
  const [activeTab, setActiveTab] = useState("memos")

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#000000",
          borderRadius: 0
        },
        components: {
          Input: {
            borderRadius: 0,
            borderRadiusSM: 0,
            borderRadiusLG: 0,
            borderRadiusXS: 0
          },
          Button: {
            borderRadius: 0,
            borderRadiusSM: 0,
            borderRadiusLG: 0,
            borderRadiusXS: 0
          },
          Modal: {
            borderRadius: 0,
            borderRadiusSM: 0,
            borderRadiusLG: 0,
            borderRadiusXS: 0
          },
          Card: {
            borderRadius: 0,
            borderRadiusSM: 0,
            borderRadiusLG: 0,
            borderRadiusXS: 0
          },
          Tabs: {
            borderRadius: 0,
            borderRadiusSM: 0,
            borderRadiusLG: 0,
            borderRadiusXS: 0
          }
        }
      }}>
      <div className="sidepanel-wrapper">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          items={[
            {
              key: "memos",
              label: (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: activeTab === "memos" ? "#fff" : "#000"
                  }}>
                  [ MEMOS ]
                </span>
              ),
              children: <MemoPage />
            },
            {
              key: "settings",
              label: (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: activeTab === "settings" ? "#fff" : "#000"
                  }}>
                  [ SETTINGS ]
                </span>
              ),
              children: <SettingsPage />
            }
          ]}
          style={{ background: "#fff" }}
          tabBarStyle={{
            background: "#fff",
            padding: "8px 8px 0 8px",
            margin: "0",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            border: "1px solid #000",
            borderBottom: "none"
          }}
          tabPosition="top"
          indicator={{ size: "circle" }}
        />
      </div>
    </ConfigProvider>
  )
}

export default SidePanel
