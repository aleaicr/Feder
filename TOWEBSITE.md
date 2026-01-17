# Deploying Feder to GitHub Pages

You can run Feder directly from your browser without installing anything. Since it uses the **File System Access API**, it can read and write to folders on your computer securely.

## 1. Important: Repository Name via "Project Pages"

You asked about hosting this as `aleaicv.github.io/feder` while keeping it in a separate repository. **This is exactly how GitHub "Project Pages" work!**

- **Rule**: If you create a repository named `feder`, GitHub automatically hosts it at `your-username.github.io/feder`.
- **Requirement**: **Your GitHub repository MUST be named `feder`**.
  - If you name it something else (e.g., `my-app`), the URL will be `.../my-app` and the app might fail to load assets because we hardcoded `/feder/` in the configuration.
  - If you change the repo name, you must update `vite.config.js` (`base: '/new-name/'`) to match.

## 2. Setup GitHub Pages

1. Create a new public repository on GitHub named **`feder`**.
2. Push this code to that repository.
3. Go to your GitHub repository settings.
4. Click on **Pages** in the left sidebar.
5. Under **Build and deployment**, select **GitHub Actions** as the source.

## 3. Deployment

The deployment is automated using GitHub Actions.

- **Automatic**: Every time you push changes to the `main` or `master` branch, the site will automatically rebuild and deploy.
- **Manual**: You can also go to the **Actions** tab in your repository, select "Deploy to GitHub Pages", and click "Run workflow".

## 4. Usage

Once deployed, access your app at:

> https://aleaicv.github.io/feder/

(This works alongside your existing Jekyll site. Your main site stays at `aleaicv.github.io`, and this app lives comfortably in its own "subdirectory" while being a completely separate repository).

**Note on Data Privacy**: 
- The website is a static interface. It does **not** store your files on any server.
- All files are saved directly to your local computer's folder that you open.
- The "Last Projects" list is stored in your browser's local cache (IndexedDB) on your specific device.

## 4. Troubleshooting

- If the page shows a 404, check that the "Deploy to GitHub Pages" action successfully completed.
- If assets (styles/scripts) are missing, ensure `vite.config.js` has the correct `base: '/feder/'` setting matching your repository name.
