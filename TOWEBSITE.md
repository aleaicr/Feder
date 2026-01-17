# Deploying Feder to GitHub Pages

You can run Feder directly from your browser without installing anything. Since it uses the **File System Access API**, it can read and write to folders on your computer securely.

## 1. Important: Repository Name via "Project Pages"

You asked about hosting this as `aleaicv.github.io/feder` while keeping it in a separate repository. **This is exactly how GitHub "Project Pages" work!**

- **Rule**: If you create a repository named `feder`, GitHub automatically hosts it at `your-username.github.io/feder`.
- **Requirement**: **Your GitHub repository MUST be named `feder`**.
  - If you name it something else (e.g., `my-app`), the URL will be `.../my-app` and the app might fail to load assets because we hardcoded `/feder/` in the configuration.
  - If you change the repo name, you must update `vite.config.js` (`base: '/new-name/'`) to match.

## 2. Setup GitHub Pages

1. Create a new public repository on GitHub named **`feder`** (or ensure your existing repository is named `feder`).
2. Push this code to that repository.
3. Go to your GitHub repository settings.
4. Click on **Pages** in the left sidebar.
5. Under **Build and deployment**, select **GitHub Actions** as the source (this is **required** for the workflow to work).

**Important**: The repository **must** be public or you need a GitHub Pro/Team plan to use GitHub Pages with private repositories.

## 3. Deployment

The deployment is automated using GitHub Actions.

- **Automatic**: Every time you push changes to the `main` or `master` branch, the site will automatically rebuild and deploy.
- **Manual**: You can also go to the **Actions** tab in your repository, select "Deploy to GitHub Pages", and click "Run workflow".

## 4. Usage

Once deployed, access your app at:

> https://aleaicr.github.io/feder/

(This works alongside your existing site. Your main site stays at `aleaicr.github.io`, and this app lives comfortably in its own "subdirectory" while being a completely separate repository).

**Note on Data Privacy**: 
- The website is a static interface. It does **not** store your files on any server.
- All files are saved directly to your local computer's folder that you open.
- The "Last Projects" list is stored in your browser's local cache (IndexedDB) on your specific device.

## 5. Troubleshooting

### Common Issues:

1. **404 Page Not Found**
   - Verify the GitHub Actions workflow completed successfully in the "Actions" tab
   - Ensure GitHub Pages is enabled and set to "GitHub Actions" as the source in repository Settings > Pages
   - Wait a few minutes after the first deployment for GitHub Pages to activate

2. **Assets Not Loading (Styles/Scripts Missing)**
   - Check that `vite.config.js` has `base: '/feder/'` (or your repository name)
   - Ensure the repository name matches the base path exactly
   - Clear your browser cache and try again

3. **Workflow Fails**
   - Check the Actions tab for error details
   - Ensure you have the correct permissions set in the workflow file
   - Verify that GitHub Pages is configured to use GitHub Actions as the deployment source

4. **Jekyll Processing Issues**
   - The workflow now automatically creates a `.nojekyll` file to prevent Jekyll from interfering with the build
   - If you see issues with files starting with underscores being missing, this should be resolved by the `.nojekyll` file

### How the Workflow Works:

The deployment workflow:
1. Checks out your code
2. Sets up Node.js and installs dependencies
3. Builds the Vite project (`npm run build`)
4. Creates a `.nojekyll` file to disable Jekyll processing
5. Configures GitHub Pages
6. Uploads the `dist` folder as a Pages artifact
7. Deploys the artifact to GitHub Pages

The `.nojekyll` file is crucial because GitHub Pages uses Jekyll by default, which can skip files and directories that start with underscores, potentially breaking modern JavaScript applications.
