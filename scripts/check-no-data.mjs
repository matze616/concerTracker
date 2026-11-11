// Pre-commit guard: refuse to commit anything that looks like personal data,
// even if .gitignore was changed or `git add -f` was used.
import { execFileSync } from 'node:child_process';

const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
	encoding: 'utf8'
})
	.split('\n')
	.filter(Boolean);

const forbidden = [
	/(^|\/)data\//,
	/(^|\/)backups\//,
	/(^|\/)exports\//,
	/\.(db|sqlite|sqlite3)(-journal|-wal|-shm)?$/i,
	/\.csv$/i,
	/(^|\/)\.env(\..*)?$/
];
const allowed = [/(^|\/)\.env\.example$/];

const bad = staged.filter((f) => forbidden.some((r) => r.test(f)) && !allowed.some((r) => r.test(f)));

if (bad.length) {
	console.error('\n✖ Commit blocked: these files look like personal concert data:\n');
	for (const f of bad) console.error('   ' + f);
	console.error('\nUnstage them with:  git restore --staged <file>\n');
	process.exit(1);
}
