import fs from "node:fs";

const token = process.env.GH_TOKEN;
const username = "rushi-builds";

if (!token) {
  throw new Error("GH_TOKEN is missing.");
}

const now = new Date();
const from = new Date(now);
from.setUTCFullYear(from.getUTCFullYear() - 1);

const query = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
      }
    }
  }
}
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "rushi-builds-profile"
  },
  body: JSON.stringify({
    query,
    variables: {
      login: username,
      from: from.toISOString(),
      to: now.toISOString()
    }
  })
});

if (!response.ok) {
  throw new Error(`GitHub API error: ${response.status}`);
}

const data = await response.json();

if (data.errors) {
  console.error(JSON.stringify(data.errors, null, 2));
  throw new Error("GitHub GraphQL request failed.");
}

const total =
  data.data.user.contributionsCollection
    .contributionCalendar.totalContributions;

console.log(`GitHub reports: ${total} contributions`);

const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="900"
     height="210"
     viewBox="0 0 900 210">

  <rect width="900" height="210"
        rx="16"
        fill="#0d1117"
        stroke="#30363d"/>

  <text x="35" y="50"
        fill="#f0f6fc"
        font-size="24"
        font-family="Arial, sans-serif"
        font-weight="bold">
    GitHub Contributions
  </text>

  <text x="35" y="105"
        fill="#58a6ff"
        font-size="48"
        font-family="Arial, sans-serif"
        font-weight="bold">
    ${total}
  </text>

  <text x="35" y="135"
        fill="#8b949e"
        font-size="16"
        font-family="Arial, sans-serif">
    contributions in the last year
  </text>

  <text x="35" y="175"
        fill="#6e7681"
        font-size="13"
        font-family="Arial, sans-serif">
    @rushi-builds
  </text>

</svg>
`;

fs.mkdirSync("assets", { recursive: true });

fs.writeFileSync(
  "assets/github-contributions.svg",
  svg
);

console.log("Contribution card generated successfully.");
