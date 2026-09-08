import { requireProject, reportProblems, displayPath } from './project-arg.js';

/** `moksha validate` — check the project without rendering anything. */
export function validate({ flags }) {
	const { path, dir, project, problems } = requireProject(flags);
	console.log(`${displayPath(process.cwd(), path)}  ${project.assets.length} asset(s), locales: ${project.locales.join(', ')}`);
	const ok = reportProblems(problems, { dir });
	return ok ? 0 : 1;
}
