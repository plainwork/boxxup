// Everything the pages say. Every claim must be checkable in the boxx repo
// (README.md, cmd/, engine/). Don't add metrics or outcomes.

export const site = {
  name: "boxx",
  url: "https://boxxup.com",
  // The latest boxx release, shown in the title bar like the TUI does. Bump it when boxx ships.
  boxxVersion: "v0.3.2",
  pitch: "Install and run Docker apps on one Linux host, from a TUI.",
  repo: "https://github.com/plainwork/boxx",
  install: "curl https://get.boxxup.com | sh",
  next: "boxx install <image> --host <hostname>",
};

// The intro plays these the way the TUI's deploy modal does (strings from engine/installer).
export const deploySteps = [
  "ensuring boxx-proxy is running",
  "docker pull ghcr.io/plainwork/boxxup:latest",
  "starting boxx",
  "waiting for /up to return 2xx",
  "switching proxy to boxx",
];

export const features = [
  {
    id: "contract",
    name: "a small contract",
    body: "An app runs on boxx if it's a Docker image, listens for HTTP on port 80 and answers GET /up with a 2xx. Public or private registry.",
  },
  {
    id: "https",
    name: "https for every hostname",
    body: "Caddy sits in front and gets a Let's Encrypt certificate per hostname. Give an app several hostnames, redirect www to the primary, or add a wildcard and read the Host header to tell tenants apart.",
    code: "boxx install <image> --host example.com --redirect-host www.example.com",
  },
  {
    id: "deploys",
    name: "zero-downtime deploys",
    body: "The new container starts beside the old one. Once GET /up returns 2xx, the proxy switches over and the old container drains before it's removed.",
  },
  {
    id: "db",
    name: "databases on request",
    body: "Pick none, MySQL or Postgres at install. boxx runs it on a private Docker network, generates the credentials and hands your app DATABASE_URL. boxx db forward opens a local port for your tools.",
  },
  {
    id: "storage",
    name: "storage that survives",
    body: "Each app gets a Docker volume at /storage. It survives redeploys and image changes. boxx remove deletes it unless you pass --keep-data.",
  },
  {
    id: "groups",
    name: "groups",
    body: "Put several apps behind one hostname, routed by path, with one shared database for the group.",
  },
  {
    id: "updates",
    name: "updates on your terms",
    body: "Each app has an update policy: off, notify or auto. A systemd timer checks the registry, and boxx upgrade updates boxx itself.",
  },
  {
    id: "ops",
    name: "one operation at a time",
    body: "Operations take a lock and write to an ops log you can open from the TUI with L, so two deploys never collide. boxx doctor checks the host.",
  },
];

// Docs start as the README's quick reference; each section becomes a page later.
export const docs = [
  {
    id: "quick-start",
    name: "quick start",
    body: "The installer puts boxx in /usr/local/bin. On Linux it also installs Docker if it's missing, enables it at boot and adds you to the docker group.",
    code: [
      ["$", "curl https://get.boxxup.com | sh"],
      ["$", "boxx install <image> --host <hostname>", "deploy your first app"],
      ["$", "boxx", "open the TUI"],
      ["$", "boxx upgrade", "upgrade boxx to the latest release"],
    ],
  },
  {
    id: "contract",
    name: "the contract",
    body: "An image works with boxx if it is a Docker image (public or private registry), listens for HTTP on port 80 and exposes GET /up returning 2xx. Anything written under /storage persists. When a database is requested, the app reads its connection from DATABASE_URL.",
  },
  {
    id: "hostnames",
    name: "hostnames",
    body: "Every app has one primary hostname and any number of extra ones. Point each hostname's DNS at the server first. A hostname can belong to only one app.",
    code: [
      ["$", "boxx host ls <app>"],
      ["$", "boxx host add <app> www.example.com --redirect"],
      ["$", "boxx host add <app> '*.example.com'", "one label, cert on first visit"],
      ["$", "boxx host primary <app> www.example.com"],
      ["$", "boxx host rm <app> app.example.net"],
    ],
  },
  {
    id: "env",
    name: "env",
    body: "env push opens your $EDITOR on the app's variables, saves them and redeploys. boxx keeps the previous set, so you can roll back. DATABASE_URL is injected for you.",
    code: [
      ["$", "boxx env show <app>"],
      ["$", "boxx env push <app> --file .env", "review, save, redeploy"],
      ["$", "boxx env rollback <app>"],
    ],
  },
  {
    id: "doctor",
    name: "doctor and logs",
    body: "boxx doctor checks the host: Docker, ports 80 and 443, your editor, the state directory and duplicate hostnames.",
    code: [["$", "boxx doctor"], ["$", "boxx logs <app>"], ["$", "boxx ls"]],
  },
];
