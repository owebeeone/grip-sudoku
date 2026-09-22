import { GitHubIcon } from './icons';

export const REPO_URL = 'https://github.com/owebeeone/grip-sudoku';

/** Icon link back to the source — this app exists to be read, not just played. */
export default function RepoLink() {
  return (
    <a
      className="icon-btn"
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="View the source on GitHub"
      title="View the source on GitHub"
    >
      <GitHubIcon />
    </a>
  );
}
