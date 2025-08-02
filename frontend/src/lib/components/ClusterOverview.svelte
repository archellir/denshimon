<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { Database, Server, Network, Box } from 'lucide-svelte';

	let overview = {
		namespace: null,
		summary: {
			pods: 0,
			services: 0,
			deployments: 0,
			statefulsets: 0,
			ingresses: 0
		}
	};
	let loading = true;
	let error = '';

	async function fetchOverview() {
		try {
			const response = await fetch('/api/k8s/overview');
			if (!response.ok) {
				throw new Error('Failed to fetch cluster overview');
			}
			overview = await response.json();
			error = '';
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function handleClusterUpdate(event: CustomEvent) {
		if (event.detail?.summary) {
			overview.summary = { ...overview.summary, ...event.detail.summary };
		}
	}

	onMount(() => {
		fetchOverview();
		
		if (browser) {
			window.addEventListener('ws-cluster_update', handleClusterUpdate as EventListener);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('ws-cluster_update', handleClusterUpdate as EventListener);
		}
	});

	const stats = [
		{
			name: 'Pods',
			value: overview.summary.pods,
			icon: Box,
			color: 'text-blue-600 dark:text-blue-400'
		},
		{
			name: 'Services',
			value: overview.summary.services,
			icon: Network,
			color: 'text-green-600 dark:text-green-400'
		},
		{
			name: 'Deployments',
			value: overview.summary.deployments,
			icon: Server,
			color: 'text-purple-600 dark:text-purple-400'
		},
		{
			name: 'StatefulSets',
			value: overview.summary.statefulsets,
			icon: Database,
			color: 'text-orange-600 dark:text-orange-400'
		}
	];
</script>

<div class="card p-6">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-lg font-medium text-gray-900 dark:text-white">
			Cluster Overview
		</h2>
		{#if loading}
			<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-kubernetes-600"></div>
		{/if}
	</div>

	{#if error}
		<div class="text-center py-8">
			<p class="text-red-600 dark:text-red-400">{error}</p>
			<button
				on:click={fetchOverview}
				class="mt-2 btn btn-secondary text-sm"
			>
				Retry
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each stats as stat}
				<div class="text-center">
					<div class="flex items-center justify-center h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 mx-auto mb-3">
						<svelte:component this={stat.icon} class="h-6 w-6 {stat.color}" />
					</div>
					<div class="text-2xl font-bold text-gray-900 dark:text-white">
						{stat.value}
					</div>
					<div class="text-sm text-gray-500 dark:text-gray-400">
						{stat.name}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>