const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

//Targets are array of objects with name and url properties
const TARGETS = [
  { name: "Group IIG", url: "https://www.groupiig.com/" },
  { name: "Lakshya Share", url: "https://lakshyashare.com/" },
  { name: "Jaguar Capital", url: "https://jaguarcapital.com.np/" },
  { name: "All Impexo", url: "https://allimpexo.com/" },
  { name: "Mail Pit", url: "https://mailtest.techarttrekkies.com.np/" },
  {
    name: "Impexo Mail Pit",
    url: "https://impexomail.techarttrekkies.com.np/",
  },
  { name: "SMS", url: "https://sms.techarttrekkies.com.np/" },
  { name: "Billing Imagine", url: "https://billing.imagineinquirysys.com/" },
  { name: "Imagine Inquiry Sys", url: "https://school.techarttrekkies.com/" },
  { name: "Impexo", url: "https://app.allimpexo.com/" },
  { name: "Reach", url: "https://reach.groupiig.com/" },
  { name: "Easy Ticket Booking", url: "https://easyticketbooking.com/" },
  { name: "SM Logistics", url: "https://www.smlogistics.com.np/" },
  { name: "Aadar Multi Investment", url: "https://aadarmic.com.np/" },
  { name: "Mero Accounts", url: "https://www.meroaccounts.com/" },
];

//CSV Path and apending logic
const CSV_PATH = path.join(process.cwd(), "daily-test-records.csv"); 
// Path to CSV file in the current working directory

function appendCsvRows(rows) { //appends rows to CSV file, creates file with header if not exists
  const header = "timestamp,project,url,status,time_seconds,status_ok,note\n";
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, header, "utf8");
  }

  const csvLines = rows.map((r) => {
    const escapeCsv = (val) => `"${String(val).replace(/"/g, `""`)}"`; // Escape double quotes for CSV
    return [
      r.timestamp,
      r.project,
      r.url,
      r.status,
      r.timeseconds,
      r.status_ok,
      r.note,
    ]
      .map(escapeCsv)
      .join(",");
  });

  fs.appendFileSync(CSV_PATH, csvLines.join("\n") + "\n", "utf8"); // Append new rows to the CSV file
}


//Main Playwright Test Block
test("Daily Test Records: status 200 and response time", async ({ 
  request, // Playwright's request context for making HTTP requests
}) => {
  test.setTimeout(300000); // 5 minutes

  const results = []; // Array to hold the results of each target test
  const runTimestamp = new Date().toISOString(); // Timestamp for when the test run started

  // Loop through each target and perform the HTTP request
  for (const target of TARGETS) { // Iterate over each target in the TARGETS array
    const start = performance.now(); // Record the start time for measuring response time
    let status = "ERR"; //
    let timeseconds = 0;
    let status_ok = false;
    let note = "";

    try {
      const response = await request.get(target.url, { timeout: 30000 }); // 30 seconds timeout
      timeseconds = Number(((performance.now() - start) / 1000).toFixed(2)); // Calculate the time taken for the request in seconds
      status = response.status();
      status_ok = status === 200;
      note = status_ok ? "OK" : `Expected 200, got ${status}`;
    } catch (err) {      // Catch any errors that occur during the request
      timeseconds = Number(((performance.now() - start) / 1000).toFixed(2));
      note = err.message.split("\n")[0]; // Get the first line of the error message
    }

    // Push the result of the current target test into the results array
    results.push({
      timestamp: runTimestamp,
      project: target.name,
      url: target.url,
      status,
      timeseconds,
      status_ok,
      note,
    });
  }

//Console Reporting, CSV Persistence, and Assertion
  console.log("\n=== Daily Test Records Results ===");
  console.table(   // Log the results in a table format for better readability
    results.map((r) => ({
      Project: r.project,
      Status: r.status,
      "Time (seconds)": r.timeseconds,
      "Status 200": r.status_ok ? "Yes" : "No",
      Note: r.note,
    })),
  );

  appendCsvRows(results);    // Append the results to the CSV file for record-keeping
  console.log(`Saved time data to: ${CSV_PATH}`);

  const non200 = results.filter((r) => r.status !== 200); 
  expect(
    non200, // Assert that there are no targets that did not return a 200 status code
    `Targets not returning 200:\n${non200.map((f) => `- ${f.project}: ${f.note}`).join("\n")}`,
  ).toHaveLength(0);   // Expect that the length of non200 array is 0, meaning all targets returned 200
});
