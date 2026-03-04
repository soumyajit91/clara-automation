const fs = require("fs")
const path = require("path")

console.log("Clara Automation Started")

/* ---------------- INPUT ---------------- */

const dataset = process.argv[2]
const account = process.argv[3]

if (!dataset || !account) {
  console.log("Usage: node index.js <dataset> <account>")
  process.exit(1)
}

const transcriptPath = path.join("data", dataset, `${account}.txt`)
const chatPath = path.join("data", dataset, "chat.txt")

if (!fs.existsSync(transcriptPath)) {
  console.log("Transcript not found:", transcriptPath)
  process.exit(1)
}

/* ---------------- LOAD FILES ---------------- */

const transcript = fs.readFileSync(transcriptPath, "utf8")

let chat = ""
if (fs.existsSync(chatPath)) {
  chat = fs.readFileSync(chatPath, "utf8")
  console.log("Chat log loaded")
}

console.log("Transcript length:", transcript.length)
console.log("Chat length:", chat.length)

/* ---------------- REGEX EXTRACTION ---------------- */

function extractEmail(text) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match ? match[0] : null
}

function extractPhone(text) {
  const match = text.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/)
  return match ? match[0] : null
}

const email = extractEmail(chat)
const phone = extractPhone(chat)

if (email) console.log("Detected email:", email)
if (phone) console.log("Detected phone:", phone)

/* ---------------- COMBINE CONTEXT ---------------- */

const context = `
CALL TRANSCRIPT
${transcript}

CHAT MESSAGES
${chat}
`

/* ---------------- CALL LLAMA ---------------- */

async function askLLM(context) {

  console.log("Sending transcript to Llama...")

  const prompt = `
You are an AI system that extracts structured onboarding data for an AI answering assistant called Clara.

The transcript is from a meeting where a service provider helps a CLIENT business set up Clara to answer their calls.

There may be two companies mentioned:

1. IMPLEMENTER / SERVICE PROVIDER  
   Example: Ben's Electric Solutions Team  
   This company is setting up the AI system.

2. CLIENT BUSINESS  
   This is the business Clara will answer calls for.  
   THIS is the company we want to extract for v1.

IMPORTANT:
Only extract information about the CLIENT BUSINESS.

Ignore:
- the implementer company
- meeting participants
- onboarding staff
- consultants

The client business is usually described as:
- the business receiving calls
- the company whose customers are calling
- the company Clara will represent

Extract the following information from the transcript and chat:

• client_company_name  
• primary_contact_name  
• primary_contact_email  
• primary_contact_phone  
• business_hours  
• emergency_dispatch_policy  
• properties_or_locations (if mentioned)  
• onboarding_notes

Return the result in this exact JSON structure:

{
  "client_company_name": "",
  "primary_contact_name": "",
  "primary_contact_email": "",
  "primary_contact_phone": "",
  "business_hours": {
    "days": "",
    "open": "",
    "close": ""
  },
  "emergency_dispatch_policy": "",
  "properties_or_locations": [],
  "onboarding_notes": ""
}

Rules:

• If a field is missing, return null  
• Do NOT include any explanation  
• Return ONLY JSON  
• Do NOT include markdown  
• Do NOT include comments  

Transcript and Chat Context:
${context}
`

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3:latest",
      prompt: prompt,
      stream: false,
      temperature: 0
    })
  })

  const data = await response.json()

  console.log("\nRAW AI RESPONSE:\n")
  console.log(data.response)

  return data.response
}

/* ---------------- MAIN PIPELINE ---------------- */

async function run() {

  console.log("Running AI extraction...")

  const aiText = await askLLM(context)

  /* ---------------- OUTPUT DIRECTORY ---------------- */

  const outDir = path.join("outputs", account, "v1")
  fs.mkdirSync(outDir, { recursive: true })

  /* ---------------- MEMO JSON ---------------- */

 function normalizeMemo(parsed) {

  return {

    account_id: accountId,
    version: "v1",

    company: {
      name: parsed.company_name,
      email: email,
      phone: phone,
      website: null
    },

    primary_contact: {
      name: parsed.contact_name,
      role: "Owner",
      phone: phone,
      email: email
    },

    business_hours: {
      days: null,
      open: null,
      close: null,
      timezone: null,
      raw: parsed.business_hours
    },

    office_address: null,

    services_supported: [],

    emergency_definition: [],

    emergency_routing_rules: {
      transfer_immediately: false,
      transfer_number: null
    },

    non_emergency_routing_rules: {
      collect_details: true,
      followup_next_business_day: true
    },

    call_transfer_rules: {
      enabled: false,
      transfer_timeout_seconds: null
    },

    integration_constraints: [],

    after_hours_flow_summary: parsed.emergency_policy,

    office_hours_flow_summary: null,

    questions_or_unknowns: [],

    notes: "Generated from onboarding transcript"
  }
}

  /* ---------------- AGENT SPEC ---------------- */

  const agentSpec = {

    agent_name: "Clara AI Agent",

    version: "v1",

    system_prompt:
      "You are Clara, an AI answering assistant helping businesses handle customer calls.",

    context_summary: aiText
  }

  fs.writeFileSync(
    path.join(outDir, "agent_spec.json"),
    JSON.stringify(agentSpec, null, 2)
  )

  /* ---------------- OPTIONAL RAW FILE ---------------- */

  fs.writeFileSync(
    path.join(outDir, "raw_llm_output.txt"),
    aiText
  )

  console.log("\nExtraction complete.")
  console.log("Files generated:")
  console.log(`${outDir}/memo.json`)
  console.log(`${outDir}/agent_spec.json`)
  console.log(`${outDir}/raw_llm_output.txt`)
}

run()