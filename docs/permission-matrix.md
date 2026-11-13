# DAAM permission matrix — preserved in P3-B2

Source analysis: docs/phase-2-analysis.md, docs/phase-3-analysis.md. Offline update 2026-11-05; no live accounts inspected in this batch.

| Condition | Access / redirect |
| --- | --- |
| Database disabled | Login shows “การเชื่อมต่อฐานข้อมูลจริงถูกปิดไว้เพื่อความปลอดภัย”; form disabled; POST login returns 503 after Origin check; preview returns disabled status |
| Protected page, database disabled | Cannot validate the account; redirects to Login without exposing protected data or trusting the old session identity |
| Anonymous/invalid/expired session | Protected pages redirect to /login |
| Active authenticated UT00000001 | /admin and existing Admin placeholders |
| Active authenticated other type | Default /user; /admin redirects to /unauthorized |
| Active authenticated UT00000002 | User history/request placeholders in addition to authenticated User menus |
| Logout | Local filesystem revocation and cookie expiry; no MySQL access required even while disabled |
| Preview | Existing development/loopback checks plus database gate; no arbitrary SQL/table selector |

The dashboard-specific all-department predicate is unchanged and is evaluated only after the Admin gate. It does not grant entry based on display name, ID or department. Rank is not an Admin grant. No general new Super Admin permission was created. Ambiguous legacy write-action/department rules remain deferred.

Server Components and the read service independently enforce their existing boundaries. Disabled mode does not expose a mock identity or make the protected Admin UI public. No mock-auth production flag or client credential/SQL API exists.
