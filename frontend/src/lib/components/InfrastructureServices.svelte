<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { ExternalLink, Play, Pause, RotateCcw } from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';

	let services: any[] = [];
	let summary = {
		total: 0,
		running: 0,
		degraded: 0,
		unknown: 0
	};
	let loading = true;
	let error = '';

	async function fetchServices() {
		try {
			const response = await fetch('/api/infrastructure/services');
			if (!response.ok) {
				throw new Error('Failed to fetch infrastructure services');
			}
			const data = await response.json();
			services = data.services;
			summary = data.summary;
			error = '';
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function handleInfrastructureUpdate(event: CustomEvent) {
		if (event.detail?.services) {
			// Update services with real-time data
			const updatedServices = event.detail.services;
			services = services.map(service => {
				const update = updatedServices.find((s: any) => s.id === service.id);
				return update ? { ...service, ...update } : service;
			});
			
			// Recalculate summary
			summary = {
				total: services.length,
				running: services.filter(s => s.status === 'running').length,
				degraded: services.filter(s => s.status === 'degraded').length,
				unknown: services.filter(s => s.status === 'unknown').length
			};
		}
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'running':
				return 'status-running';
			case 'degraded':
				return 'status-degraded';
			default:
				return 'status-unknown';
		}
	}

	function openService(domain?: string) {
		if (domain) {
			window.open(`https://${domain}`, '_blank');
		}
	}

	onMount(() => {
		fetchServices();
		
		if (browser) {
			window.addEventListener('ws-infrastructure_update', handleInfrastructureUpdate as EventListener);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('ws-infrastructure_update', handleInfrastructureUpdate as EventListener);
		}
	});
</script>

<div class="card p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h2 class="text-lg font-medium text-gray-900 dark:text-white">
				Infrastructure Services
			</h2>
			<div class="flex items-center space-x-4 mt-2 text-sm">
				<span class="flex items-center space-x-1">
					<div class="w-2 h-2 bg-green-500 rounded-full"></div>
					<span class="text-gray-600 dark:text-gray-400">{summary.running} Running</span>
				</span>
				<span class="flex items-center space-x-1">
					<div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
					<span class="text-gray-600 dark:text-gray-400">{summary.degraded} Degraded</span>
				</span>
				<span class="flex items-center space-x-1">
					<div class="w-2 h-2 bg-gray-500 rounded-full"></div>
					<span class="text-gray-600 dark:text-gray-400">{summary.unknown} Unknown</span>
				</span>
			</div>
		</div>
		{#if loading}
			<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-kubernetes-600"></div>
		{/if}
	</div>

	{#if error}
		<div class="text-center py-8">
			<p class="text-red-600 dark:text-red-400">{error}</p>
			<button
				on:click={fetchServices}
				class="mt-2 btn btn-secondary text-sm"
			>
				Retry
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each services as service}
				<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
					<div class="flex items-start justify-between mb-3">
						<div>
							<h3 class="font-medium text-gray-900 dark:text-white">
								{service.name}
							</h3>
							<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
								{service.description}
							</p>
						</div>
						<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusClass(service.status)}">
							{service.status}
						</span>
					</div>

					<div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
						<div class="flex justify-between">
							<span>Type:</span>
							<span class="font-medium">{service.type}</span>
						</div>
						<div class="flex justify-between">
							<span>Port:</span>
							<span class="font-medium">{service.port}</span>
						</div>
						<div class="flex justify-between">
							<span>Replicas:</span>
							<span class="font-medium">{service.replicas.ready}/{service.replicas.desired}</span>
						</div>
						<div class="flex justify-between">
							<span>Pods:</span>
							<span class="font-medium">{service.pods}</span>
						</div>
						{#if service.lastUpdated}
							<div class="flex justify-between">
								<span>Updated:</span>
								<span class="font-medium">
									{formatDistanceToNow(new Date(service.lastUpdated), { addSuffix: true })}
								</span>
							</div>
						{/if}
					</div>

					<div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
						<div class="flex space-x-2">
							<button
								class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
								title="Restart"
							>
								<RotateCcw class="h-4 w-4" />
							</button>
							{#if service.type === 'Deployment'}
								<button
									class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
									title="Scale"
								>
									<Play class="h-4 w-4" />
								</button>
							{/if}
						</div>

						{#if service.domain}
							<button
								on:click={() => openService(service.domain)}
								class="flex items-center space-x-1 text-xs text-kubernetes-600 dark:text-kubernetes-400 hover:text-kubernetes-700 dark:hover:text-kubernetes-300"
							>
								<span>{service.domain}</span>
								<ExternalLink class="h-3 w-3" />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>