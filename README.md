# DashDev

DashDev is a powerful Electron-based dashboard designed to streamline your development workflow. It provides a centralized interface for managing your GitHub projects, remote servers, and deployments.

## Features

- **GitHub Integration**: Authenticate securely using the GitHub CLI to access your private and public repositories.
- **Project Dashboard**: Get a comprehensive recap of all the projects you are part of.
- **SSH Key Management**: Generate SSH keys directly within the application. These keys are stored locally and can be used for secure server authentication.
- **Network Scanning**: Automatically scan your local network to detect available servers and pre-fill server details for easy addition.
- **Server Management**: Manually add and manage remote servers. View a list of your configured servers in one place.
- **Repository Management**: Browse your GitHub repositories. Navigate directly to the GitHub page or trigger deployments.
- **Deployment System**:
  - Deploy projects directly from the app.
  - specific target servers.
  - Choose environments (if defined in the project).
  - Customize launch commands.
- **Deployment History**: specific log of all deployment attempts, tracking both successes and failures.
- **Customizable UI**: Personalize your experience with Light/Dark mode and custom primary colors.

## Installation (For Users)

You can download the latest pre-built version of the application directly from the **Releases** section of this repository.

### Prerequisites

- **GitHub CLI (`gh`)**: Required for authentication and full functionality.
  - [Install GitHub CLI](https://cli.github.com/)
  - Run `gh auth login` to authenticate.

### Install & Run

#### Windows
1. Download the `.exe` installer from the latest release.
2. Run the installer and follow the instructions.

#### macOS
1. Download the `.dmg` file from the latest release.
2. Open the file and move "DashDev" to your Applications folder.

#### Linux
You can choose between `.deb` (Debian/Ubuntu) or `.AppImage` (Universal).

**Using .deb:**
1. Download the `.deb` package.
2. Install it using `dpkg` or your system's package manager:
   ```bash
   sudo dpkg -i dashdev_v1.0.0_amd64.deb
   ```

**Using .AppImage:**
1. Download the `.AppImage` file.
2. Make it executable:
   ```bash
   chmod +x DashDev-version.AppImage
   ```
3. Run the file.

## Installation (For Developers)

If you want to contribute or modify the code, follow these steps to set up the development environment with hot-reloading.

1.  **Clone & Install** (if not done already):

    ```bash
    git clone https://github.com/your-username/dashdev.git
    cd dashdev
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

## Usage Guide

### Authentication

Upon launching the application, you will need to authenticate using the GitHub CLI. Ensure `gh` is installed and you are logged in on your system.

### Dashboard

The main dashboard provides an overview of your projects and recent activities, giving you a quick snapshot of your development landscape.

### SSH Keys

Navigate to the **SSH Keys** tab to manage your access credentials.

- **Create a Key**: Generate a new SSH key pair. The private key is securely stored by the Electron application.
- **Manual Setup**: After generating a key, you must manually add the public key to your target server's `~/.ssh/authorized_keys` file to enable passwordless authentication.

### Network Scanning

Use the **Network Scanning** tab to discover servers on your local network.

- **Scan**: Initiates a scan of the local IP range.
- **Add Server**: Detected servers can be used to pre-fill the form in the "My Servers" tab, simplifying the setup process.

### My Servers

The **My Servers** tab is your server inventory.

- **Add Server**: Manually enter server details (IP, Hostname, User, etc.) if they weren't detected via scan.
- **List**: View and manage all your added servers.

### Repositories

The **Repositories** tab fetches your GitHub data using the GitHub CLI.

- **View**: List all repositories (private and public) you have access to.
- **Navigate**: Click to open the repository in your browser.
- **Deploy**: Click the "Deploy" button to open the deployment configuration:
  1.  Select a target server from your list.
  2.  Select an environment (e.g., staging, production) if configured in the repo.
  3.  Review or edit the launch commands (e.g., `docker-compose up -d`).
  4.  Execute the deployment.

### Deployments

Track your deployment history in the **Deployments** tab. This log provides a detailed record of all deployment attempts, helping you troubleshoot failures and confirm successes.

### Settings

Customize the application look and feel in the **Settings** tab.

- **Theme**: Toggle between Light Mode and Dark Mode.
- **Primary Color**: Select a primary color to accent the UI according to your preference.

## License

[MIT](LICENSE)
