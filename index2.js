const fs = require("fs")
const path = require("path")

console.log("Clara Onboarding Update Pipeline")

const accountId = process.argv[2] || "acc_001"

/* -------------------------
PATHS
-------------------------- */

const onboardingTranscript = path.join(__dirname,"data","onboarding",`${accountId}.txt`)
const onboardingChat = path.join(__dirname,"data","onboarding",`${accountId}_chat.txt`)

const v1Memo = path.join(__dirname,"outputs",accountId,"v1","memo.txt")

const v2OutputDir = path.join(__dirname,"outputs",accountId,"v2")

/* -------------------------
CHECK IF ONBOARDING EXISTS
-------------------------- */

if(!fs.existsSync(onboardingTranscript)){
    console.log("No onboarding transcript found.")
    console.log("Skipping v2 generation.")
    process.exit()
}

/* -------------------------
CREATE OUTPUT FOLDER
-------------------------- */

if(!fs.existsSync(v2OutputDir)){
    fs.mkdirSync(v2OutputDir,{recursive:true})
}

/* -------------------------
LOAD FILES
-------------------------- */

const transcript = fs.readFileSync(onboardingTranscript,"utf8")

let chat = ""
if(fs.existsSync(onboardingChat)){
    chat = fs.readFileSync(onboardingChat,"utf8")
}

let previousMemo = ""
if(fs.existsSync(v1Memo)){
    previousMemo = fs.readFileSync(v1Memo,"utf8")
}

console.log("Onboarding transcript loaded")
console.log("Loaded previous v1 memo")

/* -------------------------
PROMPT
-------------------------- */

const prompt = `
You are updating an AI answering agent configuration.

We previously created a version v1 using a demo call.

Now we have onboarding information.

Your job is to update the configuration.

Rules:
- Preserve all valid v1 information
- Only modify if onboarding confirms or changes it
- Do not invent missing data
- Clearly structure the operational configuration

Sections:

Company Information
Primary Contact
Business Hours
Emergency Handling
After Hours Policy
Routing Rules
Special Constraints
Missing Information

Previous Agent Configuration (v1):

${previousMemo}

Onboarding Transcript:

${transcript}

Chat Messages:

${chat}
`

/* -------------------------
CALL OLLAMA
-------------------------- */

async function callLLM(){

    console.log("Sending onboarding context to Llama...")

    const response = await fetch("http://localhost:11434/api/generate",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            model:"llama3",
            prompt:prompt,
            stream:false
        })
    })

    const data = await response.json()

    return data.response
}

/* -------------------------
GENERATE CHANGELOG
-------------------------- */

function generateChangeLog(v1,v2){

return `
CHANGELOG

Account: ${accountId}

Update generated from onboarding call.

-------------------------------------

Previous Configuration (v1):

${v1}

-------------------------------------

Updated Configuration (v2):

${v2}

-------------------------------------

End of log.
`
}

/* -------------------------
MAIN
-------------------------- */

async function run(){

const raw = await callLLM()

console.log("\nRAW AI OUTPUT:\n")
console.log(raw)

/* SAVE RAW OUTPUT */

fs.writeFileSync(
path.join(v2OutputDir,"raw_llm_output.txt"),
raw
)

/* CREATE V2 MEMO */

const memo = `
ACCOUNT MEMO (v2)

Account ID: ${accountId}

Updated configuration derived from onboarding call.

${raw}
`

fs.writeFileSync(
path.join(v2OutputDir,"memo.txt"),
memo
)

/* CREATE AGENT SPEC */

const agentSpec = `
AGENT SPEC (v2)

Agent Name: Clara - ${accountId}

System Prompt:

You are Clara, an AI answering assistant.

Use the onboarding configuration below when handling calls.

${raw}

Call Flow:

Greeting
Ask purpose
Collect caller name and phone
Determine emergency
Route appropriately
Close politely
`

fs.writeFileSync(
path.join(v2OutputDir,"agent_spec.txt"),
agentSpec
)

/* CREATE CHANGELOG */

const changelog = generateChangeLog(previousMemo,raw)

fs.writeFileSync(
path.join(__dirname,"outputs",accountId,"changelog.txt"),
changelog
)

console.log("\nGenerated files:")
console.log(`${v2OutputDir}/memo.txt`)
console.log(`${v2OutputDir}/agent_spec.txt`)
console.log(`outputs/${accountId}/changelog.txt`)
}

run()