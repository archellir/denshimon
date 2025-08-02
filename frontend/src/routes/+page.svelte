<script lang="ts">
	import { onMount } from 'svelte';
	import ClusterOverview from '$lib/components/ClusterOverview.svelte';
	import InfrastructureServices from '$lib/components/InfrastructureServices.svelte';
	import { websocketStore } from '$lib/stores/websocket';

	onMount(() => {
		// Connect to WebSocket for real-time updates
		websocketStore.connect();
		
		// Subscribe to cluster and infrastructure updates
		websocketStore.subscribe('cluster');
		websocketStore.subscribe('infrastructure');

		return () => {
			websocketStore.disconnect();
		};
	});
</script>

<svelte:head>
	<title>Dashboard - K8s WebUI</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">
			Infrastructure Dashboard
		</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">
			Monitor and manage your Kubernetes infrastructure services
		</p>
	</div>

	<!-- Cluster Overview -->
	<ClusterOverview />

	<!-- Infrastructure Services -->
	<InfrastructureServices />
</div>