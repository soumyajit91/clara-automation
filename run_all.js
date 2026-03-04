const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("CLARA AUTOMATION BATCH RUNNER\n")

const demoDir = path.join(__dirname, "data", "demo")
const onboardingDir = path.join(__dirname, "data", "onboarding")

const demoFiles = fs.readdirSync(demoDir)

demoFiles.forEach(file => {

    if (!file.endsWith(".txt")) return

    const accountId = file.replace(".txt", "")

    console.log("\n---------------------------------")
    console.log("Processing Account:", accountId)
    console.log("---------------------------------")

    try {

        console.log("Running DEMO pipeline (v1)...")

        execSync(`node index.js demo ${accountId}`, { stdio: "inherit" })

    } catch (err) {

        console.log("Demo processing failed for", accountId)

    }

    const onboardingFile = path.join(onboardingDir, `${accountId}.txt`)

    if (fs.existsSync(onboardingFile)) {

        try {

            console.log("\nRunning ONBOARDING pipeline (v2)...")

            execSync(`node index2.js ${accountId}`, { stdio: "inherit" })

        } catch (err) {

            console.log("Onboarding processing failed for", accountId)

        }

    } else {

        console.log("\nNo onboarding file found → skipping v2")

    }

})

console.log("\nBatch processing complete.")