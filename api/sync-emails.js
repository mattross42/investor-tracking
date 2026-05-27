const PROJECTS = [
  "The Interestings",
  "What's Eating Gilbert Grape",
  "You Got Older",
  "What The Constitution Means to Me",
  "Pass Over",
  "Is This A Room",
  "Dana H",
];

const DEAL_KEYWORDS = {
  documents: {
    offering: ["offering doc", "offering documents", "prospectus", "PPM"],
    deck: ["deck", "pitch deck", "investor deck", "presentation"],
    operating: ["operating agreement", "operating doc", "LLC agreement"],
    coProLetter: ["co-producer letter", "co-producer agreement", "side letter"],
  },
  status: {
    checkReceived: [
      "check received",
      "funds received",
      "check cleared",
      "wire received",
    ],
    committed: [
      "committed",
      "confirmed",
      "investment confirmed",
      "locked in",
    ],
    verbalCommitment: [
      "verbal commitment",
      "verbally committed",
      "told us",
      "said yes",
    ],
    awaitingDocs: [
      "awaiting documents",
      "awaiting docs",
      "waiting for documents",
      "pending documents",
    ],
    papers: ["papers", "paperwork", "documents to sign", "docs to sign"],
    signature: ["signature", "sign", "signing", "needs to sign"],
  },
};

/**
 * Extract deal-related information from email body
 * @param {string} emailBody - The email body text
 * @returns {object} Extracted information
 */
function extractEmailInfo(emailBody) {
  const bodyLower = emailBody.toLowerCase();

  // Document type detection
  const hasOfferingDocs = DEAL_KEYWORDS.documents.offering.some((keyword) =>
    bodyLower.includes(keyword)
  );
  const hasDeck = DEAL_KEYWORDS.documents.deck.some((keyword) =>
    bodyLower.includes(keyword)
  );
  const hasOperatingAgreement = DEAL_KEYWORDS.documents.operating.some(
    (keyword) => bodyLower.includes(keyword)
  );
  const hasCoProLetter = DEAL_KEYWORDS.documents.coProLetter.some((keyword) =>
    bodyLower.includes(keyword)
  );

  // Deal terms extraction (e.g., "1-for-3", "1-for-5")
  const dealTermsRegex = /(\d+)-for-(\d+)/gi;
  const dealTerms = [];
  let match;
  while ((match = dealTermsRegex.exec(emailBody)) !== null) {
    dealTerms.push(match[0]);
  }

  // Dollar amounts extraction
  const amountsRegex = /\$[\d,]+\.?\d*/g;
  const amounts = [];
  const rawAmounts = emailBody.match(amountsRegex) || [];
  rawAmounts.forEach((amount) => {
    if (!amounts.includes(amount)) {
      amounts.push(amount);
    }
  });

  // Status inference
  let inferredStatus = null;
  if (DEAL_KEYWORDS.status.checkReceived.some((keyword) =>
    bodyLower.includes(keyword)
  )) {
    inferredStatus = "check received";
  } else if (DEAL_KEYWORDS.status.committed.some((keyword) =>
    bodyLower.includes(keyword)
  )) {
    inferredStatus = "committed";
  } else if (DEAL_KEYWORDS.status.verbalCommitment.some((keyword) =>
    bodyLower.includes(keyword)
  )) {
    inferredStatus = "verbal commitment";
  } else if (DEAL_KEYWORDS.status.awaitingDocs.some((keyword) =>
    bodyLower.includes(keyword)
  )) {
    inferredStatus = "awaiting docs";
  } else if (DEAL_KEYWORDS.status.papers.some((keyword) =>
    bodyLower.includes(keyword)
  )) {
    inferredStatus = "papers";
  } else if (DEAL_KEYWORDS.status.signature.some((keyword) =>
    bodyLower.includes(keyword)
  )) {
    inferredStatus = "signature";
  }

  return {
    hasOfferingDocs,
    hasDeck,
    hasOperatingAgreement,
    hasCoProLetter,
    dealTerms,
    amounts,
    inferredStatus,
  };
}

/**
 * Fetch records from Airtable API
 * @param {string} baseId - Airtable base ID
 * @param {string} tableId - Airtable table ID
 * @param {object} options - Query options (filterByFormula, pageSize, etc)
 * @returns {Promise<array>} Array of records
 */
async function fetchFromAirtable(baseId, tableId, options = {}) {
  const token = process.env.AIRTABLE_PAT_TOKEN;
  if (!token) {
    throw new Error("AIRTABLE_PAT_TOKEN environment variable not set");
  }

  const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);

  if (options.filterByFormula) {
    url.searchParams.append("filterByFormula", options.filterByFormula);
  }
  if (options.pageSize) {
    url.searchParams.append("pageSize", options.pageSize);
  }

  console.log(
    `[Airtable] Fetching from table ${tableId} with options:`,
    options
  );

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(
      `[Airtable] Error fetching from ${tableId}:`,
      response.status,
      error
    );
    throw new Error(`Airtable fetch failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log(
    `[Airtable] Fetched ${data.records?.length || 0} records from ${tableId}`
  );

  return data.records || [];
}

/**
 * Create a new record in Airtable
 * @param {string} baseId - Airtable base ID
 * @param {string} tableId - Airtable table ID
 * @param {object} fields - Record fields
 * @returns {Promise<object>} Created record
 */
async function createAirtableRecord(baseId, tableId, fields) {
  const token = process.env.AIRTABLE_PAT_TOKEN;
  if (!token) {
    throw new Error("AIRTABLE_PAT_TOKEN environment variable not set");
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;

  console.log(`[Airtable] Creating record in ${tableId} with fields:`, fields);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(
      `[Airtable] Error creating record in ${tableId}:`,
      response.status,
      error
    );
    throw new Error(
      `Airtable create failed: ${response.status} ${error}`
    );
  }

  const data = await response.json();
  console.log(`[Airtable] Created record with ID:`, data.id);

  return data;
}

/**
 * Update an existing record in Airtable
 * @param {string} baseId - Airtable base ID
 * @param {string} tableId - Airtable table ID
 * @param {string} recordId - Record ID to update
 * @param {object} fields - Fields to update
 * @returns {Promise<object>} Updated record
 */
async function updateAirtableRecord(baseId, tableId, recordId, fields) {
  const token = process.env.AIRTABLE_PAT_TOKEN;
  if (!token) {
    throw new Error("AIRTABLE_PAT_TOKEN environment variable not set");
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;

  console.log(
    `[Airtable] Updating record ${recordId} in ${tableId} with fields:`,
    fields
  );

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(
      `[Airtable] Error updating record ${recordId} in ${tableId}:`,
      response.status,
      error
    );
    throw new Error(
      `Airtable update failed: ${response.status} ${error}`
    );
  }

  const data = await response.json();
  console.log(`[Airtable] Updated record ID:`, data.id);

  return data;
}

/**
 * Query emails from Superhuman/Outlook using MCP
 * This is a placeholder that would connect to the Superhuman MCP
 * In production, this would use the actual MCP client
 * @param {number} hoursBack - Number of hours to look back
 * @returns {Promise<array>} Array of emails
 */
async function queryEmailsFromSuperhuman(hoursBack = 24) {
  console.log(
    `[Email] Querying emails from past ${hoursBack} hours mentioning projects`
  );

  // This is a placeholder. In production, you would:
  // 1. Initialize a Superhuman MCP client
  // 2. Query for emails mentioning any of the PROJECTS
  // 3. Return the email objects with from, subject, body, date, etc.

  // For now, returning empty array as placeholder
  const emails = [];

  console.log(
    `[Email] Found ${emails.length} emails mentioning projects in past ${hoursBack} hours`
  );

  return emails;
}

/**
 * Determine which project(s) an email is about
 * @param {string} emailBody - Email body text
 * @param {string} emailSubject - Email subject
 * @returns {array} Array of project names mentioned
 */
function identifyProjects(emailBody, emailSubject) {
  const text = `${emailSubject} ${emailBody}`.toLowerCase();
  const mentionedProjects = [];

  PROJECTS.forEach((project) => {
    if (text.includes(project.toLowerCase())) {
      mentionedProjects.push(project);
    }
  });

  return mentionedProjects;
}

/**
 * Main sync function
 * @returns {Promise<object>} Sync result
 */
async function syncEmails() {
  const BASE_ID = "appHcZoNno7BykcLw";
  const PEOPLE_TABLE = "tblYNJ09DAoF9LOkd";
  const PROJECTS_TABLE = "tblyF45DiI3bKCBqD";
  const PROJECT_INVESTORS_TABLE = "tblk0oNnzgQ93g5Hu";
  const INTERACTIONS_TABLE = "tblFH4xJOvWoWuyyh";

  let processedCount = 0;
  const errors = [];

  try {
    console.log("[Sync] Starting email sync process...");

    // Query emails from past 24 hours
    const emails = await queryEmailsFromSuperhuman(24);
    console.log(`[Sync] Processing ${emails.length} emails`);

    for (const email of emails) {
      try {
        const { from, subject, body, date } = email;
        console.log(`[Sync] Processing email from ${from}: "${subject}"`);

        // Identify which projects this email mentions
        const mentionedProjects = identifyProjects(body, subject);

        if (mentionedProjects.length === 0) {
          console.log(
            `[Sync] Email does not mention any tracked projects, skipping`
          );
          continue;
        }

        console.log(
          `[Sync] Email mentions projects: ${mentionedProjects.join(", ")}`
        );

        // Look up existing investor by email address
        const emailFilter = `{Email} = "${from}"`;
        let investorRecord = null;
        let investorId = null;

        try {
          const existingInvestors = await fetchFromAirtable(
            BASE_ID,
            PEOPLE_TABLE,
            { filterByFormula: emailFilter }
          );

          if (existingInvestors.length > 0) {
            investorRecord = existingInvestors[0];
            investorId = investorRecord.id;
            console.log(
              `[Sync] Found existing investor record: ${investorId}`
            );
          }
        } catch (error) {
          console.error(`[Sync] Error looking up investor:`, error);
          errors.push(`Failed to lookup investor ${from}: ${error.message}`);
        }

        // Create new investor record if not found
        if (!investorId) {
          try {
            console.log(`[Sync] Creating new investor record for ${from}`);

            const nameMatch = from.match(/^([^@]+)/);
            const defaultName = nameMatch ? nameMatch[1] : from;

            const newInvestor = await createAirtableRecord(
              BASE_ID,
              PEOPLE_TABLE,
              {
                Email: from,
                Name: defaultName,
                "Source": "Email",
              }
            );

            investorId = newInvestor.id;
            console.log(
              `[Sync] Created new investor record: ${investorId}`
            );
          } catch (error) {
            console.error(`[Sync] Error creating investor record:`, error);
            errors.push(
              `Failed to create investor record for ${from}: ${error.message}`
            );
            continue;
          }
        }

        // Extract deal information from email
        const dealInfo = extractEmailInfo(body);
        console.log(`[Sync] Extracted deal info:`, dealInfo);

        // Create interaction record for each mentioned project
        for (const project of mentionedProjects) {
          try {
            console.log(
              `[Sync] Creating interaction record for project: ${project}`
            );

            // Build notes with all extracted data
            const notes = [];
            notes.push(`Subject: ${subject}`);
            notes.push(`From: ${from}`);

            if (dealInfo.dealTerms.length > 0) {
              notes.push(`Deal Terms: ${dealInfo.dealTerms.join(", ")}`);
            }

            if (dealInfo.amounts.length > 0) {
              notes.push(`Amounts: ${dealInfo.amounts.join(", ")}`);
            }

            const documentTypes = [];
            if (dealInfo.hasOfferingDocs) documentTypes.push("Offering Docs");
            if (dealInfo.hasDeck) documentTypes.push("Deck");
            if (dealInfo.hasOperatingAgreement)
              documentTypes.push("Operating Agreement");
            if (dealInfo.hasCoProLetter) documentTypes.push("Co-Producer Letter");

            if (documentTypes.length > 0) {
              notes.push(`Documents Discussed: ${documentTypes.join(", ")}`);
            }

            const interactionFields = {
              "Project": [project],
              "Investor": [investorId],
              "Subject": subject,
              "Date": date || new Date().toISOString(),
              "Email Type": "investor",
              "Notes": notes.join("\n"),
              "Outcome": dealInfo.inferredStatus
                ? "Deal Info Found"
                : "No Deal Info",
            };

            const interaction = await createAirtableRecord(
              BASE_ID,
              INTERACTIONS_TABLE,
              interactionFields
            );

            console.log(
              `[Sync] Created interaction record: ${interaction.id}`
            );

            // Update investor commitment status if deal info was found
            if (dealInfo.inferredStatus) {
              try {
                console.log(
                  `[Sync] Updating investor status to: ${dealInfo.inferredStatus}`
                );

                await updateAirtableRecord(
                  BASE_ID,
                  PEOPLE_TABLE,
                  investorId,
                  {
                    "Commitment Status": dealInfo.inferredStatus,
                  }
                );
              } catch (error) {
                console.error(
                  `[Sync] Error updating investor status:`,
                  error
                );
                errors.push(
                  `Failed to update investor status for ${from}: ${error.message}`
                );
              }
            }

            processedCount++;
          } catch (error) {
            console.error(
              `[Sync] Error creating interaction for ${project}:`,
              error
            );
            errors.push(
              `Failed to create interaction for ${project}: ${error.message}`
            );
          }
        }
      } catch (error) {
        console.error(`[Sync] Error processing email:`, error);
        errors.push(`Failed to process email: ${error.message}`);
      }
    }

    console.log(
      `[Sync] Completed email sync. Processed: ${processedCount}, Errors: ${errors.length}`
    );

    return {
      success: true,
      processedCount,
      errors,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[Sync] Critical error during sync:`, error);
    return {
      success: false,
      processedCount,
      errors: [
        ...errors,
        `Critical error: ${error.message}`,
      ],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Main handler function for Vercel
 */
export default async function handler(req, res) {
  console.log(`[Handler] Received ${req.method} request to ${req.url}`);
  console.log(`[Handler] Time: ${new Date().toISOString()}`);

  // Validate cron secret
  const cronSecret = req.headers["x-vercel-cron-secret"];
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error("[Handler] CRON_SECRET environment variable not set");
    return res
      .status(500)
      .json({ error: "Server configuration error" });
  }

  if (cronSecret !== expectedSecret) {
    console.warn(
      "[Handler] Invalid cron secret provided"
    );
    return res
      .status(401)
      .json({ error: "Unauthorized" });
  }

  try {
    const result = await syncEmails();
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Handler] Unhandled error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
