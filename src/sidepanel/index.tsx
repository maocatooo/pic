import { Tabs } from "antd"
import { useState } from "react"

import { MemoPage } from "~/sidepanel/memo"
import { SettingsPage } from "~/sidepanel/settings"

import "./sidepanel.css"

function SidePanel() {
  const [activeTab, setActiveTab] = useState("memos")

  return (
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
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: activeTab === "memos" ? "#fff" : "#000" }}>
                [ MEMOS ]
              </span>
            ),
            children: <MemoPage />
          },
          {
            key: "settings",
            label: (
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: activeTab === "settings" ? "#fff" : "#000" }}>
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
          border: "2px solid #000",
          borderBottom: "none"
        }}
        tabPosition="top"
        indicator={{ size: "origins" }}
      />
    </div>
  )
}

export default SidePanel
