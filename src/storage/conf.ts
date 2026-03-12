import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const confKey = "confKey"
enum TP {
  GOOGLE,
  OPENAI
}

type OPENAI = {
  OPENAI_APIKEY?: string
  OPENAI_MODEL?: string
  OPENAI_BASEURL?: string
}

type Conf = {
  tp?: TP
  openai?: OPENAI
  sourceLang?: string
  targetLang?: string
}


const getConf = async ():Promise<Conf> => {
  const conf = (await storage.get(confKey)) as Conf
  if (!conf){
    return setConf({
        tp: TP.GOOGLE,
        sourceLang: "auto",
        targetLang: "zh-cn"
    })
  }
  return conf
}

const setConf = async (conf) => {
  await storage.set(confKey, conf)
  return conf
}

export { getConf, setConf, TP }
