const fs = require('fs');
const https = require('https');
const path = require('path');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd3NxdWNmZmFta3RmbnJva255Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUxNDM1MSwiZXhwIjoyMDk2MDkwMzUxfQ.bgTL0xikp8ioD6bIwzUWTlEK0HJCZsnMPo6IiYk5a_c';
const BASE = path.join(__dirname, '..');

const files = [["Candidates/1Password/job-notes.md", "candidates/1password/job-notes.md", "text/markdown"], ["Candidates/1Password/Joel_Melick_Resume_1Password.docx", "candidates/1password/resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Candidates/1Password/Joel_Melick_CoverLetter_1Password.docx", "candidates/1password/cover-letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Candidates/1Password/linkedin-outreach.md", "candidates/1password/linkedin-outreach.md", "text/markdown"], ["Candidates/Databricks/job-notes.md", "candidates/databricks/job-notes.md", "text/markdown"], ["Candidates/Databricks/Joel_Melick_Resume_Databricks.docx", "candidates/databricks/resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Candidates/Databricks/Joel_Melick_CoverLetter_Databricks.docx", "candidates/databricks/cover-letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Candidates/Databricks/linkedin-outreach.md", "candidates/databricks/linkedin-outreach.md", "text/markdown"], ["Candidates/SandboxAQ/job-notes.md", "candidates/sandboxaq/job-notes.md", "text/markdown"], ["Candidates/SandboxAQ/Joel_Melick_Resume_SandboxAQ.docx", "candidates/sandboxaq/resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Candidates/SandboxAQ/Joel_Melick_CoverLetter_SandboxAQ.docx", "candidates/sandboxaq/cover-letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Candidates/SandboxAQ/linkedin-outreach.md", "candidates/sandboxaq/linkedin-outreach.md", "text/markdown"], ["Candidates/Vanta-SPM/job-notes.md", "candidates/vanta-spm/job-notes.md", "text/markdown"], ["Candidates/Vanta-SPM/Joel_Melick_Resume_Vanta-SPM.docx", "candidates/vanta-spm/resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Candidates/Vanta-SPM/Joel_Melick_CoverLetter_Vanta-SPM.docx", "candidates/vanta-spm/cover-letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Candidates/Vanta-SPM/linkedin-outreach.md", "candidates/vanta-spm/linkedin-outreach.md", "text/markdown"], ["Jobs/Vanta-GPM-GRC/job-notes.md", "jobs/vanta-gpm-grc/job-notes.md", "text/markdown"], ["Jobs/Vanta-GPM-GRC/Joel_Melick_Resume_Vanta-GPM-GRC.docx", "jobs/vanta-gpm-grc/resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Jobs/Vanta-GPM-GRC/Joel_Melick_CoverLetter_Vanta-GPM-GRC.docx", "jobs/vanta-gpm-grc/cover-letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["Jobs/Vanta-GPM-GRC/linkedin-outreach.md", "jobs/vanta-gpm-grc/linkedin-outreach.md", "text/markdown"]];

function upload(localPath, storagePath, contentType) {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync(path.join(BASE, localPath));
    const req = https.request({
      hostname: 'nowsqucffamktfnrokny.supabase.co',
      path: `/storage/v1/object/job-documents/${storagePath}`,
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
        'Content-Length': data.length
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(storagePath + ':' + res.statusCode));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  for (const [lp, sp, ct] of files) {
    try {
      const result = await upload(lp, sp, ct);
      console.log(result);
    } catch(e) {
      console.log(sp + ':ERROR:' + e.message);
    }
  }
  console.log('Done.');
})();
