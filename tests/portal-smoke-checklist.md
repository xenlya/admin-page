# Administrator portal acceptance / smoke checks

Testing should use **approved fake/demonstration student IDs**. Never paste real access tokens in bug reports.

| ID | Procedure | Expected result | Result |
|---|---|---|---|
| W01 | Visit /dashboard without signing in | Redirect to login | [ ] |
| W02 | Sign in with a non-allowlisted Entra account | Access rejected | [ ] |
| W03 | Sign in with an allowlisted staff account | Dashboard loads | [ ] |
| W04 | Enter SIS ID containing letters or 5 digits | Client/server rejects | [ ] |
| W05 | Enter valid demo SIS ID 104404156 | Three semester demo rows | [ ] |
| W06 | Inspect March 2025, September 2025, March 2026 | 83.09%, 99.50%, N/A; no unit average | [ ] |
| W07 | Open report from same result | Separate browser tab; DRAFT not official | [ ] |
| W08 | Print -> Save as PDF | File saved to *computer*, no mobile transfer | [ ] |
| W09 | Inspect PDF | No signature, no university stamp; synthetic warning remains | [ ] |
| W10 | Sign out, retry /api/attendance and /api/report | Both 401 | [ ] |
| W11 | Simulate n8n workflow disabled | Actionable error; no invented percentages | [ ] |
| W12 | Check /api/health while signed out | 401; while signed in only coarse config check | [ ] |
| W13 | Open duplicate browser tabs and stale result | Both reports always reflect selected SIS ID | [ ] |

**Production blocker:** W01–W13 passing does not secure a public n8n webhook; the university must approve end-to-end authorisation and official figures before live student data or document issuance.
