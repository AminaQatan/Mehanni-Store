# Mehanni Store
Created by: Ms. Amina Qatan

A colourful, one-page educational resource store, ready for GitHub Pages.
Prepared from the latest version on 10 October 2026.

## Publish from your desktop browser

1. Extract this ZIP (Windows: right-click the ZIP, then Extract All).
2. Go to https://github.com/new and create a PUBLIC repository named Mehanni-Store.
3. In the new repository, select "uploading an existing file". In a repository
   that already has files, use Add file > Upload files.
4. Open the extracted folder. Drag its CONTENTS into GitHub: index.html,
   assets, books, README.md, and .nojekyll. Keep index.html at the repository's
   top level. Do not upload the ZIP or an outer folder containing the website.
5. Let all files finish uploading, then commit the changes to main.
6. Open Settings > Pages. Under Source choose Deploy from a branch.
   Choose main and /(root), then Save.
7. Wait for GitHub to finish publishing. Open the website link shown in Pages.
   GitHub says publication can take up to 10 minutes after a push.

If your account is aminaqatan and the repository name is exactly Mehanni-Store,
the expected address after successful publication is:
https://aminaqatan.github.io/Mehanni-Store/
This package does not create or publish that address by itself.

## What is included

- The complete landing page and About Me poster.
- Seven linked apps: Azkari, Zoozi, Strategy Finder, 3D Tool Builder,
  Smart Tech Attendance, Teams Live Leaderboard and VocaQuest.
- Live calendar, calculator, sticky notes, whiteboard and focus timer.
- Whiteboard auto-draw, typed text, styles, colours, undo and PNG export.
- Three positive affirmations that rotate daily using Oman time.
- Click sounds with a mute control.
- 45 book cards and their covers: 13 children's PDFs are included;
  the 4 teacher-development and 28 vocational books use Google Drive links.
- All website paths are relative, so a GitHub project-site address works.

## Upload tips

The complete website is about 172 MiB because it includes the children's PDFs.
Every individual file is smaller than GitHub's 25 MiB browser-upload limit.
There are fewer than 100 files, GitHub's documented upload count limit.

If your connection struggles with one upload, first upload index.html, assets,
README.md and .nojekyll. Then upload the books folder in a second batch.
If you upload PDFs individually, open or create the books folder in GitHub first
so the PDF paths remain books/filename.pdf.

If Windows hides .nojekyll, the rest of this plain HTML site can still be
uploaded. You may create the empty .nojekyll file in GitHub afterward using
Add file > Create new file.

## Using and updating the website

You do not need Cloudflare, a build command, npm, or a server for this store.
The linked apps keep their existing addresses and hosting.
Google Drive book links keep their existing sharing permissions.

Notes and timer state are stored in each visitor's browser. Notes already saved
on the previous website address do not automatically move to the GitHub address.
Copy any notes you want to keep before switching addresses.
Whiteboard drawings are kept while the page is open; save a PNG before refreshing.

Future changes made to another hosted copy of the store will not automatically
update GitHub. Upload the newer website files into this same repository to update it.

## Official GitHub instructions

File uploads:
https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

Pages settings:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
