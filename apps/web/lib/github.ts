import { Octokit } from "@octokit/rest";

export function createOctokit(token: string) {
  return new Octokit({ auth: token });
}

export async function listUserRepos(token: string) {
  const octokit = createOctokit(token);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
    type: "owner",
  });
  return data.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    name: r.name,
    owner: r.owner.login,
    default_branch: r.default_branch,
    private: r.private,
    updated_at: r.updated_at,
  }));
}

export async function installWebhook(
  token: string,
  owner: string,
  repo: string,
  webhookUrl: string,
  webhookSecret: string
) {
  const octokit = createOctokit(token);
  const { data } = await octokit.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookUrl,
      content_type: "json",
      secret: webhookSecret,
    },
    events: ["pull_request"],
    active: true,
  });
  return data.id;
}

export async function removeWebhook(
  token: string,
  owner: string,
  repo: string,
  hookId: number
) {
  const octokit = createOctokit(token);
  await octokit.repos.deleteWebhook({ owner, repo, hook_id: hookId });
}
