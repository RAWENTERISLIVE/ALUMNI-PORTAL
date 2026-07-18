# Sentinel Security Journal 🛡️

This journal documents critical security learnings and vulnerability patterns found in the codebase.

## 2025-02-15 - ServeFile Path Traversal Prevention
**Vulnerability:** A Path Traversal vulnerability existed in the file serving controller (`backend/src/controllers/uploadController.ts` in `serveFile`), where unsafe user input in `filename` could be resolved outside of the intended uploads directory.
**Learning:** Using simple string concatenation with parent directory references can allow users to read arbitrary system files.
**Prevention:** Sanitize the file path using `path.basename` to extract only the filename. On Windows/Linux dual environments, ensure to also normalize path separators (e.g., replace backslashes with forward slashes) before applying basename, and check that the target resolves to a file (`fs.statSync(filePath).isFile()`) rather than a directory.

## 2025-02-18 - Mass Assignment Protection on Reports
**Vulnerability:** A Mass Assignment vulnerability was discovered in `backend/src/controllers/reportController.ts` within the `createReport` handler, where the request body was directly spread into the Prisma model creation query (`...req.body`). This allowed standard users to manipulate administrative or system-controlled properties such as `status`, `reviewedById`, `reviewedAt`, and `adminNotes`.
**Learning:** Blindly spreading or assigning request bodies to database query parameters creates a mass assignment risk, exposing internal and administrative fields to unauthorized user manipulation.
**Prevention:** Implement strict whitelisting for all user-contributed queries. Extract and map only the user-modifiable fields (`type`, `description`, `reason`, and ID fields) rather than accepting arbitrary payload structures.
