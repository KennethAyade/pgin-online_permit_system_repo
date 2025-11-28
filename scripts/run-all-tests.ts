/**
 * Master Test Runner
 *
 * Runs all automated tests for the batch upload workflow
 *
 * Usage:
 *   npm test
 *   npm run test:all
 */

import { spawn } from "child_process"
import { resolve } from "path"

interface TestSuite {
  name: string
  file: string
  description: string
}

const testSuites: TestSuite[] = [
  {
    name: "Workflow Integration Test",
    file: "tests/workflows/batch-upload-workflow.test.ts",
    description: "Complete end-to-end workflow simulation",
  },
  {
    name: "Acceptance Requirements API Test",
    file: "tests/api/acceptance-requirements.test.ts",
    description: "API endpoint integration tests",
  },
  {
    name: "Other Documents API Test",
    file: "tests/api/other-documents.test.ts",
    description: "Other documents API tests",
  },
]

interface TestResult {
  suite: string
  status: "PASS" | "FAIL"
  duration: number
  error?: string
}

class TestRunner {
  private results: TestResult[] = []

  async runTest(suite: TestSuite): Promise<TestResult> {
    const startTime = Date.now()

    console.log(`\n${"=".repeat(60)}`)
    console.log(`📋 Running: ${suite.name}`)
    console.log(`   ${suite.description}`)
    console.log(`${"=".repeat(60)}\n`)

    return new Promise((resolve) => {
      const testProcess = spawn("npx", ["tsx", suite.file], {
        stdio: "inherit",
        shell: true,
      })

      testProcess.on("close", (code) => {
        const duration = Date.now() - startTime
        const status = code === 0 ? "PASS" : "FAIL"

        const result: TestResult = {
          suite: suite.name,
          status,
          duration,
          error: code !== 0 ? `Exit code: ${code}` : undefined,
        }

        this.results.push(result)
        resolve(result)
      })

      testProcess.on("error", (error) => {
        const duration = Date.now() - startTime
        const result: TestResult = {
          suite: suite.name,
          status: "FAIL",
          duration,
          error: error.message,
        }

        this.results.push(result)
        resolve(result)
      })
    })
  }

  async runAll() {
    console.log("╔════════════════════════════════════════════════════════╗")
    console.log("║        BATCH UPLOAD WORKFLOW - TEST SUITE              ║")
    console.log("╚════════════════════════════════════════════════════════╝")
    console.log("")
    console.log("🔧 Test Configuration:")
    console.log("   Test Suites: " + testSuites.length)
    console.log("   Test User: sagkurtkyle@gmail.com")
    console.log("   Test Admin: admin@mgb.gov.ph")
    console.log("")

    const startTime = Date.now()

    // Run tests sequentially
    for (const suite of testSuites) {
      await this.runTest(suite)
    }

    const totalDuration = Date.now() - startTime

    // Print summary
    this.printSummary(totalDuration)

    // Exit with appropriate code
    const allPassed = this.results.every((r) => r.status === "PASS")
    process.exit(allPassed ? 0 : 1)
  }

  printSummary(totalDuration: number) {
    console.log("\n\n")
    console.log("╔════════════════════════════════════════════════════════╗")
    console.log("║                   TEST SUMMARY                         ║")
    console.log("╚════════════════════════════════════════════════════════╝")
    console.log("")

    const passed = this.results.filter((r) => r.status === "PASS").length
    const failed = this.results.filter((r) => r.status === "FAIL").length

    this.results.forEach((result) => {
      const icon = result.status === "PASS" ? "✅" : "❌"
      const duration = `${(result.duration / 1000).toFixed(2)}s`
      console.log(`${icon} ${result.suite.padEnd(40)} ${duration}`)
      if (result.error) {
        console.log(`   └─ Error: ${result.error}`)
      }
    })

    console.log("")
    console.log("─".repeat(60))
    console.log(`📊 Total Tests: ${this.results.length}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
    console.log("─".repeat(60))

    if (failed === 0) {
      console.log("")
      console.log("🎉 All tests passed! The batch upload workflow is ready for production.")
      console.log("")
      console.log("Next steps:")
      console.log("  1. Run manual frontend tests (see TESTING_GUIDE.md)")
      console.log("  2. Test with real users")
      console.log("  3. Deploy to production")
    } else {
      console.log("")
      console.log("⚠️  Some tests failed. Please review the errors above.")
      console.log("")
      console.log("Troubleshooting:")
      console.log("  1. Check database connection")
      console.log("  2. Verify test accounts exist (run: npm run db:reset)")
      console.log("  3. Review test logs for specific errors")
      console.log("  4. See TESTING_GUIDE.md for detailed instructions")
    }

    console.log("")
  }
}

// Run all tests
const runner = new TestRunner()
runner.runAll().catch((error) => {
  console.error("❌ Test runner error:", error)
  process.exit(1)
})
