/**
 * @file Current GitHub Repository
 * @author netcon
 */

import { reuseable } from '@/helpers/func';
import router from '@/router';
import {
	getGithubBranchRefs,
	getGitHubPullDetail,
	getGithubTagRefs,
	getGithubPullFiles,
} from '@/interfaces/github-api-rest';

export interface RepositoryRef {
	name: string;
	ref: string;
	node_id: string;
	url: string;
	object: {
		sha: string;
		type: string;
		url: string;
	};
}

export interface RepositoryPull {
	head: {
		sha: string;
	};
	base: {
		sha: string;
	};
}

export enum FileChangeType {
	ADDED = 'added',
	REMOVED = 'removed',
	MODIFIED = 'modified',
	RENAMED = 'renamed',
}

export interface RepositoryChangedFile {
	filename: string;
	previous_filename?: string;
	status: FileChangeType;
}

export class Repository {
	private static instance: Repository;
	private _branchRefsMap: Map<string, RepositoryRef[]>;
	private _tagRefsMap: Map<string, RepositoryRef[]>;
	private _pullMap: Map<string, RepositoryPull>;
	private _pullFilesMap: Map<string, RepositoryChangedFile[]>;

	private constructor() {
		this._branchRefsMap = new Map();
		this._tagRefsMap = new Map();
		this._pullMap = new Map();
		this._pullFilesMap = new Map();
	}

	public static getInstance() {
		if (Repository.instance) {
			return this.instance;
		}
		return (Repository.instance = new Repository());
	}

	// get current repo owner
	public getOwner() {
		const pathname = router.history.location.pathname;
		return pathname.split('/').filter(Boolean)[0] || 'conwnet';
	}

	// get current repo name
	public getRepo() {
		const pathname = router.history.location.pathname;
		return pathname.split('/').filter(Boolean)[1] || 'github1s';
	}

	// get all branches for current repository
	public getBranches = reuseable(
		async (forceUpdate: boolean = false): Promise<RepositoryRef[]> => {
			const [owner, repo] = [this.getOwner(), this.getRepo()];
			const key = `${owner}+${repo}`;

			if (!this._branchRefsMap.has(key) || forceUpdate) {
				this._branchRefsMap.set(key, await getGithubBranchRefs(owner, repo));
			}
			return this._branchRefsMap.get(key);
		}
	);

	// get all tags for current repository
	public getTags = reuseable(
		async (forceUpdate: boolean = false): Promise<RepositoryRef[]> => {
			const [owner, repo] = [this.getOwner(), this.getRepo()];
			const key = `${owner}+${repo}`;

			if (!this._tagRefsMap.has(key) || forceUpdate) {
				this._tagRefsMap.set(key, await getGithubTagRefs(owner, repo));
			}
			return this._tagRefsMap.get(key);
		}
	);

	public getPull = reuseable(
		async (
			pullNumber: number,
			forceUpdate: boolean = false
		): Promise<RepositoryPull> => {
			const [owner, repo] = [this.getOwner(), this.getRepo()];
			const key = `${owner}+${repo}+${pullNumber}`;

			if (!this._pullMap.has(key) || forceUpdate) {
				this._pullMap.set(
					key,
					await getGitHubPullDetail(owner, repo, pullNumber)
				);
			}
			return this._pullMap.get(key);
		}
	);

	public getPullFiles = reuseable(
		async (
			pullNumber: number,
			forceUpdate: boolean = false
		): Promise<RepositoryChangedFile[]> => {
			const [owner, repo] = [this.getOwner(), this.getRepo()];
			const key = `${owner}+${repo}+${pullNumber}`;

			if (!this._pullFilesMap.has(key) || forceUpdate) {
				this._pullFilesMap.set(
					key,
					await getGithubPullFiles(owner, repo, pullNumber)
				);
			}
			return this._pullFilesMap.get(key);
		}
	);
}

export default Repository.getInstance();
